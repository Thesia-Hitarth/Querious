import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Badge from "../models/Badge.js";

dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });

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

const seedBadges = async () => {
  try {
    const mongoURI = process.env.MONGO_URL || process.env.CONNECTION_URL || process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error("MongoDB URI not found in env configuration");
      return;
    }
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB for badge seeding...");

    for (const b of initialBadges) {
      await Badge.updateOne({ code: b.code }, { $set: b }, { upsert: true });
    }

    console.log("Seeded 12 standard badges successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

seedBadges();
