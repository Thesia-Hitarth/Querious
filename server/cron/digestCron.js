import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import User from "../models/auth.js";
import PendingDigest from "../models/PendingDigest.js";
import { sendDigestEmail } from "../utils/mailHelper.js";

dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });

const runDigest = async () => {
  const frequency = process.argv[2]; // 'daily' or 'weekly'
  if (!frequency || (frequency !== "daily" && frequency !== "weekly")) {
    console.error("Please specify frequency: daily or weekly");
    process.exit(1);
  }

  const mongoURI = process.env.MONGO_URL || process.env.CONNECTION_URL || process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error("MongoDB URI not found");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log(`Connected to MongoDB for processing ${frequency} digest...`);

    // Find users who have this digest frequency
    const users = await User.find({ "notificationPreferences.digest": frequency });
    if (users.length === 0) {
      console.log(`No users configured for ${frequency} digest.`);
      process.exit(0);
    }

    for (const user of users) {
      const pending = await PendingDigest.find({ userId: user._id });
      if (pending.length === 0) continue;

      console.log(`Sending ${frequency} digest containing ${pending.length} notifications to ${user.email}...`);
      await sendDigestEmail(user.email, user.name, pending, frequency);

      // Clear pending queue for this user
      await PendingDigest.deleteMany({ userId: user._id });
    }

    console.log(`Successfully completed ${frequency} digest processing!`);
    process.exit(0);
  } catch (error) {
    console.error(`Error executing ${frequency} digest:`, error);
    process.exit(1);
  }
};

runDigest();
