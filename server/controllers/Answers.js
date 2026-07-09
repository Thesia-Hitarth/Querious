import mongoose from "mongoose";
import Questions from "../models/Questions.js";
import Answers from "../models/Answers.js";
import User from "../models/auth.js";
import { sendNotification } from "../utils/notificationHelper.js";
import { checkBadgeTriggers } from "../utils/badgeEngine.js";
import SuggestedEdit from "../models/SuggestedEdit.js";
import { notifyMentionedUsers } from "../utils/mentionHelper.js";
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

    if (question) {
      if (String(question.userId) !== String(userId)) {
        await sendNotification(
          question.userId,
          `${authorName} answered your question: "${question.questionTitle}"`,
          questionId,
          "answer"
        );
      }

      if (question.watchers && question.watchers.length > 0) {
        for (const watcherId of question.watchers) {
          if (String(watcherId) !== String(userId) && String(watcherId) !== String(question.userId)) {
            await sendNotification(
              watcherId,
              `New answer added to watched question: "${question.questionTitle}"`,
              questionId,
              "answer"
            );
          }
        }
      }
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

  const performDeletion = async (session = null) => {
    const answer = await Answers.findById(answerId).session(session);
    if (!answer) {
      return { status: 404, message: "Answer not found..." };
    }

    if (String(answer.userId) !== String(userId)) {
      return { status: 403, message: "Action forbidden: You are not the author." };
    }

    const questionId = answer.questionId;

    if (answer.isAccepted && questionId) {
      const question = await Questions.findById(questionId).session(session);
      if (question) {
        question.acceptedAnswerId = null;
        await question.save({ session });
        
        await updateReputationAndBadges(answer.userId, -15, "acceptance_reversed", answer._id, session);
        await updateReputationAndBadges(question.userId, -2, "acceptance_reversed", question._id, session);
      }
    }

    await Answers.findByIdAndDelete(answerId).session(session);

    if (questionId) {
      await Questions.findByIdAndUpdate(
        questionId,
        [
          {
            $set: {
              noOfAnswers: { $max: [0, { $subtract: ["$noOfAnswers", 1] }] },
            },
          },
        ],
        { session }
      );
    }

    return { status: 200, message: "Successfully deleted..." };
  };

  let session = null;
  try {
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await performDeletion(session);
    });
    session.endSession();
    return res.status(result.status).json({ message: result.message });
  } catch (error) {
    if (session) session.endSession();

    const isTransNotSupported = 
      error.message.includes("replica set") || 
      error.message.includes("transaction") || 
      error.code === 20;

    if (isTransNotSupported) {
      console.warn("MongoDB environment does not support transactions. Falling back to non-transactional deletion.");
      try {
        const result = await performDeletion(null);
        return res.status(result.status).json({ message: result.message });
      } catch (fallbackError) {
        console.error(fallbackError);
        return res.status(500).json({ message: "Failed to delete answer." });
      }
    } else {
      console.error(error);
      return res.status(500).json({ message: error.message || "Failed to delete answer." });
    }
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
      await updateReputationAndBadges(answer.userId, repDelta, "vote_received", answer._id);
    }

    // Trigger badge evaluation
    checkBadgeTriggers(userId, "vote_cast", { value });
    if (answer.userId) {
      checkBadgeTriggers(answer.userId, "answer_upvoted", {
        answerId: answer._id,
        upVotesCount: updated.upVote?.length || 0,
        downVotesCount: updated.downVote?.length || 0,
        questionId: answer.questionId,
      });
    }

    // Notify answer author if not voting on own answer
    if (answer.userId && String(answer.userId) !== String(userId)) {
      const voteText = value === "upVote" ? "upvoted" : "downvoted";
      await sendNotification(
        answer.userId,
        `Someone ${voteText} your answer.`,
        answer.questionId,
        "vote"
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

  const performAcceptance = async (session = null) => {
    const answer = await Answers.findById(answerId).session(session);
    if (!answer) {
      return { status: 404, message: "Answer not found..." };
    }

    const question = await Questions.findById(answer.questionId).session(session);
    if (!question) {
      return { status: 404, message: "Question not found..." };
    }

    if (String(question.userId) !== String(userId)) {
      return { status: 403, message: "Only the question author can accept an answer." };
    }

    const isCurrentlyAccepted = answer.isAccepted;

    if (isCurrentlyAccepted) {
      answer.isAccepted = false;
      await answer.save({ session });

      question.acceptedAnswerId = null;
      await question.save({ session });

      await updateReputationAndBadges(answer.userId, -15, "acceptance_reversed", answer._id, session);
      await updateReputationAndBadges(question.userId, -2, "acceptance_reversed", question._id, session);

      return { status: 200, message: "Answer un-accepted successfully", data: answer };
    }

    const prevAcceptedAnswer = await Answers.findOne({
      questionId: question._id,
      isAccepted: true,
    }).session(session);

    if (prevAcceptedAnswer) {
      prevAcceptedAnswer.isAccepted = false;
      await prevAcceptedAnswer.save({ session });
      await updateReputationAndBadges(prevAcceptedAnswer.userId, -15, "acceptance_reversed", prevAcceptedAnswer._id, session);
    }

    answer.isAccepted = true;
    await answer.save({ session });

    question.acceptedAnswerId = answerId;
    await question.save({ session });

    await updateReputationAndBadges(answer.userId, 15, "answer_accepted", answer._id, session);
    if (!prevAcceptedAnswer) {
      await updateReputationAndBadges(question.userId, 2, "accepted_answer_bonus", question._id, session);
    }

    if (answer.userId) {
      checkBadgeTriggers(answer.userId, "answer_accepted", {
        answerId: answer._id,
        questionId: question._id,
      });
    }

    if (answer.userId && String(answer.userId) !== String(userId)) {
      await sendNotification(
        answer.userId,
        `Your answer was accepted for: "${question.questionTitle}"`,
        question._id,
        "accept"
      );
    }

    return { status: 200, message: "Answer accepted successfully", data: answer };
  };

  let session = null;
  try {
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await performAcceptance(session);
    });
    session.endSession();
    return res.status(result.status).json({ message: result.message, data: result.data });
  } catch (error) {
    if (session) session.endSession();

    const isTransNotSupported = 
      error.message.includes("replica set") || 
      error.message.includes("transaction") || 
      error.code === 20;

    if (isTransNotSupported) {
      console.warn("MongoDB environment does not support transactions. Falling back to non-transactional acceptance.");
      try {
        const result = await performAcceptance(null);
        return res.status(result.status).json({ message: result.message, data: result.data });
      } catch (fallbackError) {
        console.error(fallbackError);
        return res.status(500).json({ message: "Failed to update answer acceptance status." });
      }
    } else {
      console.error(error);
      return res.status(500).json({ message: error.message || "Failed to update answer acceptance status." });
    }
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

    const user = await User.findById(userId);
    const isAuthor = String(answer.userId) === String(userId);
    const isAdmin = user?.isAdmin;
    const isPrivileged = (user?.reputation || 0) >= 2000;

    if (!isAuthor && !isAdmin && !isPrivileged) {
      const suggestedEdit = new SuggestedEdit({
        targetType: "answer",
        targetId: answerId,
        suggestedBy: userId,
        body: answerBody ? xss(answerBody) : "",
      });
      await suggestedEdit.save();
      return res.status(201).json({
        status: "suggested",
        message: "Your edit has been suggested and is pending review.",
      });
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
    checkBadgeTriggers(userId, "comment_posted");
    notifyMentionedUsers(commentBody, userId, userName, answer.questionId, "comment");

    if (answer.userId && String(answer.userId) !== String(userId)) {
      await sendNotification(
        answer.userId,
        `${userName} commented on your answer.`,
        answer.questionId,
        "comment"
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

export const flagOutdated = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("Answer unavailable...");
  }

  try {
    const answer = await Answers.findById(id);
    if (!answer) {
      return res.status(404).send("Answer not found...");
    }

    const alreadyFlagged = answer.outdatedFlags.some((f) => String(f.userId) === String(userId));
    if (alreadyFlagged) {
      return res.status(409).json({ message: "You have already flagged this answer as outdated." });
    }

    answer.outdatedFlags.push({ userId, reason });
    await answer.save();

    res.status(200).json(answer);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Failed to mark answer as outdated" });
  }
};

export const clearOutdatedFlags = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("Answer unavailable...");
  }

  try {
    const answer = await Answers.findById(id);
    if (!answer) {
      return res.status(404).send("Answer not found...");
    }

    const user = await User.findById(userId);
    const isAuthor = String(answer.userId) === String(userId);
    const isAdmin = user?.isAdmin;

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "Only the author or an admin can clear outdated flags." });
    }

    answer.outdatedFlags = [];
    await answer.save();

    res.status(200).json(answer);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Failed to clear outdated flags" });
  }
};
