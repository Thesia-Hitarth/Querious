import User from "../models/auth.js";

export const updateReputationAndBadges = async (userId, repDelta) => {
  if (!userId) return null;
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    // Increment reputation, ensuring it doesn't fall below 1 (standard SO behavior)
    user.reputation = Math.max(1, (user.reputation || 1) + repDelta);

    // Compute badges based on thresholds
    user.badges = {
      gold: Math.floor(user.reputation / 500),
      silver: Math.floor((user.reputation % 500) / 100),
      bronze: Math.floor((user.reputation % 100) / 20),
    };

    await user.save();
    return user;
  } catch (error) {
    console.error("Error updating reputation and badges:", error);
    throw error;
  }
};
