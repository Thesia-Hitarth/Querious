import User from "../models/auth.js";
import { sendNotification } from "./notificationHelper.js";

export const notifyMentionedUsers = async (commentBody, commenterId, commenterName, targetId, category) => {
  try {
    // Regex matches @ followed by alphanumeric, dot, hyphen or underscore
    const matches = commentBody.match(/@([\w.-]+)/g) || [];
    if (matches.length === 0) return;

    // Deduplicate and lower-case
    const uniqueNames = [...new Set(matches.map((m) => m.substring(1).toLowerCase()))];

    for (const name of uniqueNames) {
      // Find user by name (exact case-insensitive match)
      const user = await User.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
      if (user && String(user._id) !== String(commenterId)) {
        await sendNotification(
          user._id,
          `${commenterName} mentioned you in a comment.`,
          targetId,
          category
        );
      }
    }
  } catch (error) {
    console.error("Error notifying mentioned users:", error);
  }
};
