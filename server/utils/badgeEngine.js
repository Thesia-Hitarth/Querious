import Badge from "../models/Badge.js";
import UserBadgeAward from "../models/UserBadgeAward.js";
import User from "../models/auth.js";
import Questions from "../models/Questions.js";
import Answers from "../models/Answers.js";
import { sendNotification } from "./notificationHelper.js";

// Helper to award a badge idempotently
const awardBadge = async (userId, badgeCode, sourceId = null) => {
  try {
    const badge = await Badge.findOne({ code: badgeCode });
    if (!badge) return;

    // Check if already awarded
    const query = { userId, badgeCode };
    if (sourceId) query.sourceId = sourceId;
    const existing = await UserBadgeAward.findOne(query);
    if (existing) return;

    // Award it
    const award = new UserBadgeAward({
      userId,
      badgeCode,
      sourceId,
    });
    await award.save();

    // Increment tier counter on User model
    const incField = `badges.${badge.tier}`;
    await User.findByIdAndUpdate(userId, { $inc: { [incField]: 1 } });

    // Send real-time notification
    await sendNotification(
      userId,
      `🏅 You earned the "${badge.name}" badge!`,
      sourceId || null,
      "badge"
    );
  } catch (err) {
    console.error("Error awarding badge:", err);
  }
};

export const checkBadgeTriggers = async (userId, eventType, context = {}) => {
  try {
    if (eventType === "question_asked") {
      // STUDENT: First question asked
      const questionCount = await Questions.countDocuments({ userId });
      if (questionCount >= 1) {
        await awardBadge(userId, "STUDENT", context.questionId);
      }
    }

    if (eventType === "comment_posted") {
      // COMMENTATOR: 10 comments posted
      // Look at comments in Questions & Answers
      const [qCommentsCount, aCommentsCount] = await Promise.all([
        Questions.countDocuments({ "comments.userId": userId }),
        Answers.countDocuments({ "comments.userId": userId })
      ]);
      if (qCommentsCount + aCommentsCount >= 10) {
        await awardBadge(userId, "COMMENTATOR");
      }
    }

    if (eventType === "profile_updated") {
      // AUTOBIOGRAPHER: about, location, website all filled
      const user = await User.findById(userId, "about location website");
      if (
        user &&
        user.about && user.about.trim() !== "" &&
        user.location && user.location.trim() !== "" &&
        user.website && user.website.trim() !== ""
      ) {
        await awardBadge(userId, "AUTOBIOGRAPHER");
      }
    }

    if (eventType === "vote_cast") {
      // Context contains value: 'upVote' or 'downVote'
      // SUPPORTER: First upvote cast
      // CRITIC: First downvote cast
      // CIVIC_DUTY: 300 total votes cast
      const [upQuestions, upAnswers, downQuestions, downAnswers] = await Promise.all([
        Questions.countDocuments({ upVote: userId }),
        Answers.countDocuments({ upVote: userId }),
        Questions.countDocuments({ downVote: userId }),
        Answers.countDocuments({ downVote: userId })
      ]);

      const upVotesCount = upQuestions + upAnswers;
      const downVotesCount = downQuestions + downAnswers;
      const totalVotes = upVotesCount + downVotesCount;

      if (context.value === "upVote" && upVotesCount >= 1) {
        await awardBadge(userId, "SUPPORTER");
      }
      if (context.value === "downVote" && downVotesCount >= 1) {
        await awardBadge(userId, "CRITIC");
      }
      if (totalVotes >= 300) {
        await awardBadge(userId, "CIVIC_DUTY");
      }
    }

    if (eventType === "answer_upvoted") {
      // Context contains: answerId, upVotesCount, questionId
      // TEACHER: First answer with >=1 upvote
      if (context.upVotesCount >= 1) {
        await awardBadge(userId, "TEACHER", context.answerId);
      }
      // NICE_ANSWER: Answer reaches 10 upvotes
      if (context.upVotesCount >= 10) {
        await awardBadge(userId, "NICE_ANSWER", context.answerId);
      }
      // GREAT_ANSWER: Answer reaches 100 upvotes
      if (context.upVotesCount >= 100) {
        await awardBadge(userId, "GREAT_ANSWER", context.answerId);
      }
      // POPULIST: Answer outscores accepted answer by 2x
      if (context.answerId && context.questionId) {
        const question = await Questions.findById(context.questionId);
        if (question && question.acceptedAnswerId && String(question.acceptedAnswerId) !== String(context.answerId)) {
          const acceptedAnswer = await Answers.findById(question.acceptedAnswerId);
          if (acceptedAnswer) {
            const acceptedScore = (acceptedAnswer.upVote?.length || 0) - (acceptedAnswer.downVote?.length || 0);
            const currentScore = context.upVotesCount - (context.downVotesCount || 0);
            if (currentScore > 10 && currentScore >= acceptedScore * 2) {
              await awardBadge(userId, "POPULIST", context.answerId);
            }
          }
        }
      }
      // NECROMANCER: Answer >=1 year old question, gets >=10 upvotes
      if (context.questionId && context.upVotesCount >= 10) {
        const question = await Questions.findById(context.questionId);
        if (question && (new Date() - new Date(question.askedOn)) >= 365 * 24 * 60 * 60 * 1000) {
          await awardBadge(userId, "NECROMANCER", context.answerId);
        }
      }
    }

    if (eventType === "answer_accepted") {
      // Context contains: answerId, questionId
      // ENLIGHTENED: Accepted answer with >=10 upvotes
      const answer = await Answers.findById(context.answerId);
      if (answer && answer.isAccepted && (answer.upVote?.length || 0) >= 10) {
        await awardBadge(userId, "ENLIGHTENED", context.answerId);
      }
    }
  } catch (err) {
    console.error("Error in checkBadgeTriggers:", err);
  }
};
