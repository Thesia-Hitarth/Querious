import mongoose from "mongoose";
import Questions from "../models/Questions.js";
import Answers from "../models/Answers.js";
import User from "../models/auth.js";
import { sendNotification } from "../utils/notificationHelper.js";
import { updateReputationAndBadges } from "../utils/reputationHelper.js";
import xss from "xss";

export const postAnswer = async (req, res) => {
  const { id: questionId } = req.params;
  const { answerBody, userAnswered } = req.body;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(404).send("question unavailable...");
  }

  try {
    const sanitizedBody = answerBody ? xss(answerBody) : answerBody;
    const newAnswer = new Answers({
      questionId,
      answerBody: sanitizedBody,
      userAnswered,
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
        `${userAnswered} answered your question: "${question.questionTitle}"`,
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
  const { id: questionId } = req.params;
  const { answerId } = req.body;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(404).send("Question unavailable...");
  }
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

    await Answers.findByIdAndDelete(answerId);

    // Decrement answer count on Question
    await Questions.findByIdAndUpdate(questionId, {
      $inc: { noOfAnswers: -1 },
    });

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

    let repDelta = 0;

    if (value === "upVote") {
      if (downIndex !== -1) {
        answer.downVote = answer.downVote.filter((id) => String(id) !== String(userId));
        repDelta += 2;
      }
      if (upIndex === -1) {
        answer.upVote.push(userId);
        repDelta += 10;
      } else {
        answer.upVote = answer.upVote.filter((id) => String(id) !== String(userId));
        repDelta -= 10;
      }
    } else if (value === "downVote") {
      if (upIndex !== -1) {
        answer.upVote = answer.upVote.filter((id) => String(id) !== String(userId));
        repDelta -= 10;
      }
      if (downIndex === -1) {
        answer.downVote.push(userId);
        repDelta -= 2;
      } else {
        answer.downVote = answer.downVote.filter((id) => String(id) !== String(userId));
        repDelta += 2;
      }
    }

    await Answers.findByIdAndUpdate(answerId, answer);

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

    res.status(200).json({ message: "Voted successfully...", data: answer });
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

  try {
    const answer = await Answers.findById(answerId);
    if (!answer) {
      return res.status(404).send("Answer not found...");
    }

    const question = await Questions.findById(answer.questionId);
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
      await answer.save();

      question.acceptedAnswerId = null;
      await question.save();

      await updateReputationAndBadges(answer.userId, -15);
      await updateReputationAndBadges(question.userId, -2);

      return res
        .status(200)
        .json({ message: "Answer un-accepted successfully", data: answer });
    } else {
      const prevAcceptedAnswer = await Answers.findOne({
        questionId: question._id,
        isAccepted: true,
      });
      if (prevAcceptedAnswer) {
        prevAcceptedAnswer.isAccepted = false;
        await prevAcceptedAnswer.save();
        await updateReputationAndBadges(prevAcceptedAnswer.userId, -15);
      }

      answer.isAccepted = true;
      await answer.save();

      question.acceptedAnswerId = answerId;
      await question.save();

      await updateReputationAndBadges(answer.userId, 15);

      if (!prevAcceptedAnswer) {
        await updateReputationAndBadges(question.userId, 2);
      }

      return res
        .status(200)
        .json({ message: "Answer accepted successfully", data: answer });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error in accepting answer" });
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
      commentBody,
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
