import Questions from "../models/Questions.js";
import Answers from "../models/Answers.js";
import User from "../models/auth.js";
import mongoose from "mongoose";
import { sendNotification } from "../utils/notificationHelper.js";
import { updateReputationAndBadges } from "../utils/reputationHelper.js";
import xss from "xss";

export const AskQuestion = async (req, res) => {
  const postQuestionData = req.body;
  const userId = req.userId;
  if (postQuestionData.questionBody) {
    postQuestionData.questionBody = xss(postQuestionData.questionBody);
  }
  const postQuestion = new Questions({ ...postQuestionData, userId });
  try {
    await postQuestion.save();
    res.status(200).json("Posted a question successfully");
  } catch (error) {
    console.error(error);
    res.status(409).json("Couldn't post a new question");
  }
};

export const getAllQuestions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const tab = req.query.tab || "newest";
    const search = req.query.search || "";
    const tag = req.query.tag || "";

    // Parse filter query parameters
    const filterNoAnswers = req.query.filterNoAnswers === "true";
    const filterNoAccepted = req.query.filterNoAccepted === "true";
    const filterDaysOld = parseInt(req.query.filterDaysOld) || null;
    const filterTags = req.query.filterTags || "";
    const filterSort = req.query.filterSort || "";

    let query = {};

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$text = { $search: escapedSearch };
    }

    if (tag) {
      query.questionTags = tag;
    }

    // Apply filters
    if (filterNoAnswers) {
      query.noOfAnswers = 0;
    }

    if (filterNoAccepted) {
      query.$or = [{ acceptedAnswerId: null }, { acceptedAnswerId: "" }];
    }

    if (filterDaysOld) {
      const cutOffDate = new Date();
      cutOffDate.setDate(cutOffDate.getDate() - filterDaysOld);
      query.askedOn = { $gte: cutOffDate };
    }

    if (filterTags) {
      const tagsArray = filterTags.split(/[\s,]+/).filter(Boolean);
      if (tagsArray.length > 0) {
        query.questionTags = { $in: tagsArray };
      }
    }

    // Determine sorting options
    let sortOption = { askedOn: -1 };
    if (filterSort) {
      if (filterSort === "newest") {
        sortOption = { askedOn: -1 };
      } else if (filterSort === "activity") {
        sortOption = { editedOn: -1, askedOn: -1 };
      } else if (filterSort === "score") {
        // Approximate score sorting by views and date
        sortOption = { views: -1, askedOn: -1 };
      } else if (filterSort === "views") {
        sortOption = { views: -1 };
      }
    } else {
      if (tab === "active") {
        sortOption = { noOfAnswers: -1, askedOn: -1 };
      } else if (tab === "newest") {
        sortOption = { askedOn: -1 };
      } else if (tab === "unanswered") {
        query.noOfAnswers = 0;
        sortOption = { askedOn: -1 };
      }
    }

    const total = await Questions.countDocuments(query);
    const questions = await Questions.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    // Fetch answers for each question to maintain frontend compatibility
    const questionsWithAnswers = await Promise.all(
      questions.map(async (question) => {
        const answers = await Answers.find({ questionId: question._id }).sort({
          isAccepted: -1,
          upVote: -1,
        });
        return { ...question.toObject(), answer: answers };
      })
    );

    res.status(200).json({
      data: questionsWithAnswers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: error.message });
  }
};

const viewTracker = new Map();

export const getQuestionDetails = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("Invalid question ID");
  }
  try {
    const question = await Questions.findById(id);
    if (!question) {
      return res.status(404).send("Question not found");
    }

    const clientIp = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const trackerKey = `${clientIp}-${id}`;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Clear stale entries
    for (const [key, value] of viewTracker.entries()) {
      if (now - value > oneHour) {
        viewTracker.delete(key);
      }
    }

    if (!viewTracker.has(trackerKey)) {
      viewTracker.set(trackerKey, now);
      question.views = (question.views || 0) + 1;
      await Questions.findByIdAndUpdate(id, { $inc: { views: 1 } });
    }

    const answers = await Answers.find({ questionId: id }).sort({
      isAccepted: -1,
      upVote: -1,
    });

    res.status(200).json({ ...question.toObject(), answer: answers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  const { id: _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("question unavailable...");
  }

  try {
    await Questions.findByIdAndDelete(_id);
    // Delete all answers associated with this question
    await Answers.deleteMany({ questionId: _id });
    res.status(200).json({ message: "successfully deleted..." });
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: error.message });
  }
};

export const voteQuestion = async (req, res) => {
  const { id: _id } = req.params;
  const { value } = req.body;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("question unavailable...");
  }

  try {
    const question = await Questions.findById(_id);
    if (!question) {
      return res.status(404).send("Question not found...");
    }

    if (String(question.userId) === String(userId)) {
      return res.status(403).json({ message: "Cannot vote on your own question" });
    }

    const upIndex = question.upVote.findIndex((id) => String(id) === String(userId));
    const downIndex = question.downVote.findIndex(
      (id) => String(id) === String(userId)
    );

    let repDelta = 0;

    if (value === "upVote") {
      if (downIndex !== -1) {
        question.downVote = question.downVote.filter(
          (id) => String(id) !== String(userId)
        );
        repDelta += 2;
      }
      if (upIndex === -1) {
        question.upVote.push(userId);
        repDelta += 10;
      } else {
        question.upVote = question.upVote.filter((id) => String(id) !== String(userId));
        repDelta -= 10;
      }
    } else if (value === "downVote") {
      if (upIndex !== -1) {
        question.upVote = question.upVote.filter((id) => String(id) !== String(userId));
        repDelta -= 10;
      }
      if (downIndex === -1) {
        question.downVote.push(userId);
        repDelta -= 2;
      } else {
        question.downVote = question.downVote.filter(
          (id) => String(id) !== String(userId)
        );
        repDelta += 2;
      }
    }
    const updated = await Questions.findByIdAndUpdate(_id, question, {
      new: true,
    });

    if (question.userId && repDelta !== 0) {
      await updateReputationAndBadges(question.userId, repDelta);
    }

    res.status(200).json({ message: "voted successfully...", data: updated });
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: "id not found" });
  }
};

export const getTagsAggregation = async (req, res) => {
  try {
    const tags = await Questions.aggregate([
      { $unwind: "$questionTags" },
      {
        $group: {
          _id: "$questionTags",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          tag: "$_id",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);
    res.status(200).json(tags);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const updateQuestion = async (req, res) => {
  const { id: _id } = req.params;
  const { questionTitle, questionBody, questionTags } = req.body;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("Question unavailable...");
  }

  try {
    const question = await Questions.findById(_id);
    if (!question) {
      return res.status(404).send("Question not found...");
    }

    if (String(question.userId) !== String(userId)) {
      return res.status(403).json({ message: "Action forbidden: You are not the author." });
    }

    const user = await User.findById(userId);
    const editorName = user ? user.name : "Anonymous";

    const sanitizedBody = questionBody ? xss(questionBody) : questionBody;

    const updatedQuestion = await Questions.findByIdAndUpdate(
      _id,
      {
        $set: {
          questionTitle,
          questionBody: sanitizedBody,
          questionTags,
          editedOn: Date.now(),
          editedBy: editorName,
        },
      },
      { new: true }
    );

    res.status(200).json(updatedQuestion);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Failed to update question" });
  }
};

export const addCommentQuestion = async (req, res) => {
  const { id: questionId } = req.params;
  const { commentBody } = req.body;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(404).send("Question unavailable...");
  }

  try {
    const user = await User.findById(userId);
    const userName = user ? user.name : "Anonymous";

    const question = await Questions.findById(questionId);
    if (!question) {
      return res.status(404).send("Question not found...");
    }

    question.comments.push({
      commentBody,
      userId,
      userCommented: userName,
      commentedOn: Date.now(),
    });

    await question.save();

    if (question.userId && String(question.userId) !== String(userId)) {
      await sendNotification(
        question.userId,
        `${userName} commented on your question: "${question.questionTitle}"`,
        questionId
      );
    }

    res.status(200).json(question);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Failed to add comment" });
  }
};

export const deleteCommentQuestion = async (req, res) => {
  const { id: questionId, commentId } = req.params;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(404).send("Question unavailable...");
  }
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(404).send("Comment unavailable...");
  }

  try {
    const question = await Questions.findById(questionId);
    if (!question) {
      return res.status(404).send("Question not found...");
    }

    const comment = question.comments.id(commentId);
    if (!comment) {
      return res.status(404).send("Comment not found...");
    }

    if (String(comment.userId) !== String(userId) && String(question.userId) !== String(userId)) {
      return res.status(403).json({ message: "Action forbidden: Unauthorized to delete comment." });
    }

    question.comments = question.comments.filter((c) => String(c._id) !== String(commentId));
    await question.save();

    res.status(200).json(question);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Failed to delete comment" });
  }
};


