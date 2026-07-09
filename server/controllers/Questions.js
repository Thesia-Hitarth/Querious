import Questions from "../models/Questions.js";
import Answers from "../models/Answers.js";
import User from "../models/auth.js";
import ViewTracker from "../models/ViewTracker.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { sendNotification } from "../utils/notificationHelper.js";
import { checkBadgeTriggers } from "../utils/badgeEngine.js";
import SuggestedEdit from "../models/SuggestedEdit.js";
import { notifyMentionedUsers } from "../utils/mentionHelper.js";
import { updateReputationAndBadges } from "../utils/reputationHelper.js";
import xss from "xss";

export const AskQuestion = async (req, res) => {
  const { questionTitle, questionBody, questionTags } = req.body;
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    const authorName = user ? user.name : "Anonymous";

    const sanitizedBody = questionBody ? xss(questionBody) : "";
    const postQuestion = new Questions({
      questionTitle,
      questionBody: sanitizedBody,
      questionTags,
      userPosted: authorName,
      userId,
    });
    await postQuestion.save();
    checkBadgeTriggers(userId, "question_asked", { questionId: postQuestion._id });
    res.status(200).json("Posted a question successfully");
  } catch (error) {
    console.error(error);
    res.status(409).json("Couldn't post a new question");
  }
};

export const getAllQuestions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 15, 50);
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
    let andConditions = [];
    let sortOption = { askedOn: -1 };
    let projection = {};

    if (req.query.cursor) {
      try {
        const [cursorTime, cursorId] = Buffer.from(req.query.cursor, "base64").toString("ascii").split("|");
        if (cursorTime && cursorId) {
          andConditions.push({
            $or: [
              { askedOn: { $lt: new Date(parseInt(cursorTime)) } },
              {
                askedOn: new Date(parseInt(cursorTime)),
                _id: { $lt: new mongoose.Types.ObjectId(cursorId) }
              }
            ]
          });
        }
      } catch (err) {
        console.warn("Invalid pagination cursor ignored:", err.message);
      }
    }

    if (search) {
      andConditions.push({
        $text: { $search: search }
      });
    }

    if (tag) {
      andConditions.push({ questionTags: tag });
    }

    // Apply filters
    if (filterNoAnswers) {
      andConditions.push({ noOfAnswers: 0 });
    }

    if (filterNoAccepted) {
      andConditions.push({
        $or: [{ acceptedAnswerId: null }, { acceptedAnswerId: "" }]
      });
    }

    if (filterDaysOld) {
      const cutOffDate = new Date();
      cutOffDate.setDate(cutOffDate.getDate() - filterDaysOld);
      andConditions.push({ askedOn: { $gte: cutOffDate } });
    }

    if (filterTags) {
      const tagsArray = filterTags.split(/[\s,]+/).filter(Boolean);
      if (tagsArray.length > 0) {
        andConditions.push({ questionTags: { $in: tagsArray } });
      }
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    // Determine sorting options
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
    
    let questions;
    const isHot = (filterSort === "hot" || tab === "hot");
    if (filterSort === "score" || isHot) {
      const aggPipeline = [
        { $match: query },
        {
          $addFields: {
            voteScore: {
              $subtract: [
                { $size: { $ifNull: ["$upVote", []] } },
                { $size: { $ifNull: ["$downVote", []] } }
              ]
            }
          }
        }
      ];

      if (isHot) {
        aggPipeline.push(
          {
            $addFields: {
              hotScore: {
                $add: [
                  "$voteScore",
                  {
                    $divide: [
                      { $subtract: [{ $toLong: "$askedOn" }, 1134028003000] },
                      45000000
                    ]
                  }
                ]
              }
            }
          },
          { $sort: { hotScore: -1 } }
        );
      } else {
        aggPipeline.push({ $sort: { voteScore: -1, askedOn: -1 } });
      }

      aggPipeline.push(
        { $skip: (page - 1) * limit },
        { $limit: limit }
      );

      questions = await Questions.aggregate(aggPipeline);
      questions = await Questions.populate(questions, { path: "userId", select: "name reputation badges avatar" });
    } else {
      questions = await Questions.find(query, projection)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "name reputation badges avatar");
    }

    // Avoid N+1 query lookup, answers are resolved at detail level.
    const questionsWithAnswers = questions.map((question) => {
      const questionObj = typeof question.toObject === "function" ? question.toObject() : question;
      return {
        ...questionObj,
        userReputation: question.userId?.reputation || 1,
        userBadges: question.userId?.badges || { gold: 0, silver: 0, bronze: 0 },
        userId: question.userId?._id || question.userId,
        answer: []
      };
    });

    const totalSiteQuestions = await Questions.countDocuments({});
    const totalSiteAnswers = await Answers.countDocuments({});
    const totalSiteUsers = await User.countDocuments({});

    let nextCursor = null;
    if (questions.length > 0) {
      const lastItem = questions[questions.length - 1];
      nextCursor = Buffer.from(`${new Date(lastItem.askedOn).getTime()}|${lastItem._id}`).toString("base64");
    }

    res.status(200).json({
      data: questionsWithAnswers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalCount: total,
      totalSiteQuestions,
      totalSiteAnswers,
      totalSiteUsers,
      nextCursor,
    });
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: error.message });
  }
};

export const getQuestionDetails = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("Invalid question ID");
  }
  try {
    const question = await Questions.findById(id).populate("userId", "reputation badges");
    if (!question) {
      return res.status(404).send("Question not found");
    }

    let currentUserId = null;
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (token) {
        let decodeData = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decodeData?.id;
      }
    } catch (err) {
      // Ignore token errors for public views, treat as anonymous
    }

    const isAuthor = currentUserId && String(question.userId) === String(currentUserId);

    let updatedQuestion = question;
    if (!isAuthor) {
      const clientIp = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      const trackerKey = currentUserId ? `${currentUserId}-${id}` : `${clientIp}-${id}`;

      try {
        const existingTracker = await ViewTracker.findOne({ trackerKey });
        if (!existingTracker) {
          await ViewTracker.create({ trackerKey });
          // Fetch and return the updated document with views incremented
          updatedQuestion = await Questions.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).populate("userId", "reputation badges");
        }
      } catch (err) {
        // Ignore duplicate key errors arising from race conditions
        if (err.code !== 11000) {
          console.error("ViewTracker error:", err);
        }
      }
    }

    const answersQuery = { questionId: id };
    let isAdminUser = false;
    if (currentUserId) {
      const viewer = await User.findById(currentUserId, "isAdmin");
      isAdminUser = !!viewer?.isAdmin;
    }

    if (!isAdminUser) {
      if (currentUserId) {
        answersQuery.$or = [
          { hidden: { $ne: true } },
          { userId: currentUserId }
        ];
      } else {
        answersQuery.hidden = { $ne: true };
      }
    }

    const answers = await Answers.find(answersQuery)
      .sort({
        isAccepted: -1,
        upVote: -1,
      })
      .populate("userId", "reputation badges");

    const mappedAnswers = answers.map((ans) => {
      const ansObj = typeof ans.toObject === "function" ? ans.toObject() : ans;
      return {
        ...ansObj,
        userReputation: ans.userId?.reputation || 1,
        userBadges: ans.userId?.badges || { gold: 0, silver: 0, bronze: 0 },
        userId: ans.userId?._id || ans.userId
      };
    });

    const questionObj = updatedQuestion.toObject();
    res.status(200).json({
      ...questionObj,
      userReputation: updatedQuestion.userId?.reputation || 1,
      userBadges: updatedQuestion.userId?.badges || { gold: 0, silver: 0, bronze: 0 },
      userId: updatedQuestion.userId?._id || updatedQuestion.userId,
      answer: mappedAnswers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  const { id: _id } = req.params;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("question unavailable...");
  }

  try {
    const question = await Questions.findById(_id);
    if (!question) {
      return res.status(404).send("Question not found...");
    }

    if (String(question.userId) !== String(userId)) {
      return res.status(403).json({ message: "Action forbidden: You are not the author." });
    }

    await Questions.findByIdAndDelete(_id);
    // Delete all answers associated with this question
    await Answers.deleteMany({ questionId: _id });

    // BUG-06 fix: no -5 reputation reversal here. Posting a question never
    // awarded +5 reputation — reputation is earned only through votes.
    // Subtracting -5 on delete was an incorrect net penalty for the author.

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

    let updated;
    let repDelta = 0;

    if (value === "upVote") {
      updated = await Questions.findOneAndUpdate(
        { _id, upVote: userId },
        { $pull: { upVote: userId } },
        { new: true }
      );
      if (updated) {
        repDelta = -10;
      } else {
        updated = await Questions.findOneAndUpdate(
          { _id, downVote: userId },
          { $pull: { downVote: userId }, $addToSet: { upVote: userId } },
          { new: true }
        );
        if (updated) {
          repDelta = 12;
        } else {
          updated = await Questions.findOneAndUpdate(
            { _id, upVote: { $ne: userId }, downVote: { $ne: userId } },
            { $addToSet: { upVote: userId } },
            { new: true }
          );
          if (updated) {
            repDelta = 10;
          }
        }
      }
    } else if (value === "downVote") {
      updated = await Questions.findOneAndUpdate(
        { _id, downVote: userId },
        { $pull: { downVote: userId } },
        { new: true }
      );
      if (updated) {
        repDelta = 2;
      } else {
        updated = await Questions.findOneAndUpdate(
          { _id, upVote: userId },
          { $pull: { upVote: userId }, $addToSet: { downVote: userId } },
          { new: true }
        );
        if (updated) {
          repDelta = -12;
        } else {
          updated = await Questions.findOneAndUpdate(
            { _id, upVote: { $ne: userId }, downVote: { $ne: userId } },
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
      return res.status(404).send("Question not found...");
    }

    if (question.userId && repDelta !== 0) {
      await updateReputationAndBadges(question.userId, repDelta, "vote_received", question._id);
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

    const user = await User.findById(userId);
    const editorName = user ? user.name : "Anonymous";

    const isAuthor = String(question.userId) === String(userId);
    const isAdmin = user?.isAdmin;
    const isPrivileged = (user?.reputation || 0) >= 2000;

    if (!isAuthor && !isAdmin && !isPrivileged) {
      const suggestedEdit = new SuggestedEdit({
        targetType: "question",
        targetId: _id,
        suggestedBy: userId,
        title: questionTitle,
        body: questionBody ? xss(questionBody) : "",
        tags: questionTags,
      });
      await suggestedEdit.save();
      return res.status(201).json({
        status: "suggested",
        message: "Your edit has been suggested and is pending review.",
      });
    }

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
      commentBody: xss(commentBody),
      userId,
      userCommented: userName,
      commentedOn: Date.now(),
    });

    await question.save();
    checkBadgeTriggers(userId, "comment_posted");
    notifyMentionedUsers(commentBody, userId, userName, questionId, "comment");

    if (question) {
      if (question.userId && String(question.userId) !== String(userId)) {
        await sendNotification(
          question.userId,
          `${userName} commented on your question: "${question.questionTitle}"`,
          questionId,
          "comment"
        );
      }

      if (question.watchers && question.watchers.length > 0) {
        for (const watcherId of question.watchers) {
          if (String(watcherId) !== String(userId) && String(watcherId) !== String(question.userId)) {
            await sendNotification(
              watcherId,
              `New comment on watched question: "${question.questionTitle}"`,
              questionId,
              "comment"
            );
          }
        }
      }
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

export const getRelatedQuestions = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("Invalid question ID");
  }
  try {
    const question = await Questions.findById(id, "questionTitle");
    if (!question) {
      return res.status(404).send("Question not found");
    }
    const results = await Questions.find(
      { $text: { $search: question.questionTitle }, _id: { $ne: id } },
      { score: { $meta: "textScore" }, questionTitle: 1, noOfAnswers: 1, acceptedAnswerId: 1, askedOn: 1 }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(5);

    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch related questions" });
  }
};

export const toggleWatchQuestion = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("Question unavailable...");
  }

  try {
    const question = await Questions.findById(id);
    if (!question) {
      return res.status(404).send("Question not found...");
    }

    if (!question.watchers) {
      question.watchers = [];
    }

    const index = question.watchers.indexOf(userId);
    if (index === -1) {
      question.watchers.push(userId);
    } else {
      question.watchers.splice(index, 1);
    }

    await question.save();
    res.status(200).json({ watchers: question.watchers });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Failed to toggle watch status" });
  }
};


