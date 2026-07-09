import mongoose from "mongoose";
import Questions from "../models/Questions.js";
import Answers from "../models/Answers.js";
import User from "../models/auth.js";
import { sendNotification } from "../utils/notificationHelper.js";
import { updateReputationAndBadges } from "../utils/reputationHelper.js";
import xss from "xss";

export const postAnswer = async (req, res) => {
  const { id: questionId } = req.params;
  const { answerBody } = req.body;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(404).send("question unavailable...");
  }

  try {
    const user = await User.findById(userId);
    const authorName = user ? user.name : "Anonymous";

    const sanitizedBody = answerBody ? xss(answerBody) : answerBody;
    const newAnswer = new Answers({
      questionId,
      answerBody: sanitizedBody,
      userAnswered: authorName,
      userId,
    });
    await newAnswer.save();

    // Increment answer count on Question and return the updated document
    const question = await Questions.findByIdAndUpdate(
      questionId,
      { $inc: { noOfAnswers: 1 } },
      { new: true }
    );

    if (question && String(question.userId) !== String(userId)) {
      await sendNotification(
        question.userId,
        `${authorName} answered your question: "${question.questionTitle}"`,
        questionId
      );
    }

    res.status(200).json(newAnswer);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error in posting answer" });
  }
};

export const deleteAnswer = async (req, res) => {
  const { id: answerId } = req.params;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(404).send("Answer unavailable...");
  }

  try {
    const answer = await Answers.findById(answerId);
    if (!answer) {
      return res.status(404).send("Answer not found...");
    }

    if (String(answer.userId) !== String(userId)) {
      return res.status(403).json({ message: "Action forbidden: You are not the author." });
    }

    const questionId = answer.questionId;
    await Answers.findByIdAndDelete(answerId);

    // Decrement answer count on Question — floor at 0 to prevent negative drift
    if (questionId) {
      await Questions.findByIdAndUpdate(questionId, [
        {
          $set: {
            noOfAnswers: { $max: [0, { $subtract: ["$noOfAnswers", 1] }] },
          },
        },
      ]);
    }

    res.status(200).json({ message: "Successfully deleted..." });
  } catch (error) {
    console.error(error);
    res.status(405).json({ message: error.message || "Failed to delete answer" });
  }
};

export const voteAnswer = async (req, res) => {
  const { id: answerId } = req.params;
  const { value } = req.body;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(404).send("Answer unavailable...");
  }

  try {
    const answer = await Answers.findById(answerId);
    if (!answer) {
      return res.status(404).send("Answer not found...");
    }

    if (String(answer.userId) === String(userId)) {
      return res.status(403).json({ message: "Cannot vote on your own answer" });
    }

    const upIndex = answer.upVote.findIndex((id) => String(id) === String(userId));
    const downIndex = answer.downVote.findIndex((id) => String(id) === String(userId));

    let updated;
    let repDelta = 0;

    if (value === "upVote") {
      updated = await Answers.findOneAndUpdate(
        { _id: answerId, upVote: userId },
        { $pull: { upVote: userId } },
        { new: true }
      );
      if (updated) {
        repDelta = -10;
      } else {
        updated = await Answers.findOneAndUpdate(
          { _id: answerId, downVote: userId },
          { $pull: { downVote: userId }, $addToSet: { upVote: userId } },
          { new: true }
        );
        if (updated) {
          repDelta = 12;
        } else {
          updated = await Answers.findOneAndUpdate(
            { _id: answerId, upVote: { $ne: userId }, downVote: { $ne: userId } },
            { $addToSet: { upVote: userId } },
            { new: true }
          );
          if (updated) {
            repDelta = 10;
          }
        }
      }
    } else if (value === "downVote") {
      updated = await Answers.findOneAndUpdate(
        { _id: answerId, downVote: userId },
        { $pull: { downVote: userId } },
        { new: true }
      );
      if (updated) {
        repDelta = 2;
      } else {
        updated = await Answers.findOneAndUpdate(
          { _id: answerId, upVote: userId },
          { $pull: { upVote: userId }, $addToSet: { downVote: userId } },
          { new: true }
        );
        if (updated) {
          repDelta = -12;
        } else {
          updated = await Answers.findOneAndUpdate(
            { _id: answerId, upVote: { $ne: userId }, downVote: { $ne: userId } },
            { $addToSet: { downVote: userId } },
            { new: true }
          );
          if (updated) {
            repDelta = -2;
          }
        }
      }
    }

    if (!updated) {
      return res.status(404).send("Answer not found...");
    }

    if (answer.userId && repDelta !== 0) {
      await updateReputationAndBadges(answer.userId, repDelta);
    }

    // Notify answer author if not voting on own answer
    if (answer.userId && String(answer.userId) !== String(userId)) {
      const voteText = value === "upVote" ? "upvoted" : "downvoted";
      await sendNotification(
        answer.userId,
        `Someone ${voteText} your answer.`,
        answer.questionId
      );
    }

    res.status(200).json({ message: "Voted successfully...", data: updated });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error voting answer" });
  }
};

export const acceptAnswer = async (req, res) => {
  const { id: answerId } = req.params;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(404).send("Answer unavailable...");
  }

  const adjustReputation = async (targetUserId, delta, session) => {
    if (!targetUserId || delta === 0) return null;
    const user = await User.findById(targetUserId).session(session);
    if (!user) return null;
    user.reputation = Math.max(1, (user.reputation || 1) + delta);
    user.badges = {
      gold: Math.floor(user.reputation / 500),
      silver: Math.floor((user.reputation % 500) / 100),
      bronze: Math.floor((user.reputation % 100) / 20),
    };
    await user.save({ session });
    return user;
  };

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const answer = await Answers.findById(answerId).session(session);
      if (!answer) {
        return res.status(404).send("Answer not found...");
      }

      const question = await Questions.findById(answer.questionId).session(session);
      if (!question) {
        return res.status(404).send("Question not found...");
      }

      if (String(question.userId) !== String(userId)) {
        return res.status(403).json({
          message: "Only the question author can accept an answer.",
        });
      }

      const isCurrentlyAccepted = answer.isAccepted;

      if (isCurrentlyAccepted) {
        answer.isAccepted = false;
        await answer.save({ session });

        question.acceptedAnswerId = null;
        await question.save({ session });

        await adjustReputation(answer.userId, -15, session);
        await adjustReputation(question.userId, -2, session);

        res.status(200).json({ message: "Answer un-accepted successfully", data: answer });
        return;
      }

      const prevAcceptedAnswer = await Answers.findOne({
        questionId: question._id,
        isAccepted: true,
      }).session(session);

      if (prevAcceptedAnswer) {
        prevAcceptedAnswer.isAccepted = false;
        await prevAcceptedAnswer.save({ session });
        await adjustReputation(prevAcceptedAnswer.userId, -15, session);
      }

      answer.isAccepted = true;
      await answer.save({ session });

      question.acceptedAnswerId = answerId;
      await question.save({ session });

      await adjustReputation(answer.userId, 15, session);
      if (!prevAcceptedAnswer) {
        await adjustReputation(question.userId, 2, session);
      }

      res.status(200).json({ message: "Answer accepted successfully", data: answer });
    });
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Error in accepting answer" });
    }
  } finally {
    session.endSession();
  }
};

export const updateAnswer = async (req, res) => {
  const { id: answerId } = req.params;
  const { answerBody } = req.body;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(404).send("Answer unavailable...");
  }

  try {
    const answer = await Answers.findById(answerId);
    if (!answer) {
      return res.status(404).send("Answer not found...");
    }

    if (String(answer.userId) !== String(userId)) {
      return res.status(403).json({ message: "Action forbidden: You are not the author." });
    }

    const sanitizedBody = answerBody ? xss(answerBody) : answerBody;

    const updatedAnswer = await Answers.findByIdAndUpdate(
      answerId,
      {
        $set: {
          answerBody: sanitizedBody,
          editedOn: Date.now(),
        },
      },
      { new: true }
    );

    res.status(200).json(updatedAnswer);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Failed to update answer" });
  }
};

export const addCommentAnswer = async (req, res) => {
  const { id: answerId } = req.params;
  const { commentBody } = req.body;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(404).send("Answer unavailable...");
  }

  try {
    const user = await User.findById(userId);
    const userName = user ? user.name : "Anonymous";

    const answer = await Answers.findById(answerId);
    if (!answer) {
      return res.status(404).send("Answer not found...");
    }

    answer.comments.push({
      commentBody: xss(commentBody),
      userId,
      userCommented: userName,
      commentedOn: Date.now(),
    });

    await answer.save();

    if (answer.userId && String(answer.userId) !== String(userId)) {
      await sendNotification(
        answer.userId,
        `${userName} commented on your answer.`,
        answer.questionId
      );
    }

    res.status(200).json(answer);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Failed to add comment to answer" });
  }
};

export const deleteCommentAnswer = async (req, res) => {
  const { id: answerId, commentId } = req.params;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(404).send("Answer unavailable...");
  }
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(404).send("Comment unavailable...");
  }

  try {
    const answer = await Answers.findById(answerId);
    if (!answer) {
      return res.status(404).send("Answer not found...");
    }

    const comment = answer.comments.id(commentId);
    if (!comment) {
      return res.status(404).send("Comment not found...");
    }

    if (String(comment.userId) !== String(userId) && String(answer.userId) !== String(userId)) {
      return res.status(403).json({ message: "Action forbidden: Unauthorized to delete comment." });
    }

    answer.comments = answer.comments.filter((c) => String(c._id) !== String(commentId));
    await answer.save();

    res.status(200).json(answer);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Failed to delete comment" });
  }
};
