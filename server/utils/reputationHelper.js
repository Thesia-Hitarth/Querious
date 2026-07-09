import User from "../models/auth.js";

export const updateReputationAndBadges = async (userId, repDelta, session = null) => {
  if (!userId) return null;
  try {
    // Atomically increment reputation to avoid lost updates due to race conditions
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { reputation: repDelta } },
      { new: true, session }
    );

    if (!user) return null;

    // Standard SO behavior: reputation must not fall below 1
    if (user.reputation < 1) {
      user.reputation = 1;
      await user.save({ session });
    }

    // Compute badges based on updated reputation
    user.badges = {
      gold: Math.floor(user.reputation / 500),
      silver: Math.floor((user.reputation % 500) / 100),
      bronze: Math.floor((user.reputation % 100) / 20),
    };

    await user.save({ session });
    return user;
  } catch (error) {
    console.error("Error updating reputation and badges:", error);
    throw error;
  }
};
