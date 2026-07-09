import Badge from "../models/Badge.js";

const initialBadges = [
  { code: "STUDENT", name: "Student", description: "First question asked", tier: "bronze", triggerType: "question_asked" },
  { code: "TEACHER", name: "Teacher", description: "First answer with >=1 upvote", tier: "bronze", triggerType: "answer_upvoted" },
  { code: "COMMENTATOR", name: "Commentator", description: "10 comments posted", tier: "bronze", triggerType: "comment_posted" },
  { code: "AUTOBIOGRAPHER", name: "Autobiographer", description: "Profile details fully filled", tier: "bronze", triggerType: "profile_updated" },
  { code: "SUPPORTER", name: "Supporter", description: "First upvote cast", tier: "bronze", triggerType: "vote_cast" },
  { code: "CRITIC", name: "Critic", description: "First downvote cast", tier: "bronze", triggerType: "vote_cast" },
  { code: "ENLIGHTENED", name: "Enlightened", description: "Accepted answer with >=10 upvotes", tier: "silver", triggerType: "answer_accepted" },
  { code: "CIVIC_DUTY", name: "Civic Duty", description: "Voted 300 times total", tier: "silver", triggerType: "vote_cast" },
  { code: "NICE_ANSWER", name: "Nice Answer", description: "Answer reaches 10 upvotes", tier: "silver", triggerType: "answer_upvoted" },
  { code: "GREAT_ANSWER", name: "Great Answer", description: "Answer reaches 100 upvotes", tier: "gold", triggerType: "answer_upvoted" },
  { code: "POPULIST", name: "Populist", description: "Answer outscores accepted answer by 2x", tier: "gold", triggerType: "answer_upvoted" },
  { code: "NECROMANCER", name: "Necromancer", description: "Answer >=1 year old question, gets >=10 upvotes", tier: "gold", triggerType: "answer_upvoted" }
];

export const seedBadges = async () => {
  try {
    for (const b of initialBadges) {
      await Badge.updateOne({ code: b.code }, { $set: b }, { upsert: true });
    }
    console.log("Badge catalog validated & seeded.");
  } catch (err) {
    console.warn("Seeding badges failed:", err.message);
  }
};
