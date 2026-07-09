import User from "../models/auth.js";
import RepLedger from "../models/RepLedger.js";
import { computeTrustLevel } from "./trustEngine.js";

export const updateReputationAndBadges = async (userId, repDelta, action = "adjustment", sourceId = null, session = null) => {
  if (!userId) return null;
  try {
    // 1. Calculate Daily Cap (+200 max positive rep per day)
    let appliedDelta = repDelta;
    if (repDelta > 0) {
      const startOfToday = new Date();
      startOfToday.setUTCHours(0, 0, 0, 0);

      const todayEntries = await RepLedger.find({
        userId,
        createdAt: { $gte: startOfToday },
        repDelta: { $gt: 0 }
      }, "repDelta", { session });

      const todayGains = todayEntries.reduce((sum, entry) => sum + entry.repDelta, 0);
      const remainingCap = Math.max(0, 200 - todayGains);
      appliedDelta = Math.min(repDelta, remainingCap);
    }

    // 2. Log in Ledger
    const ledgerEntry = new RepLedger({
      userId,
      repDelta: appliedDelta,
      originalDelta: repDelta,
      action,
      sourceId,
    });
    await ledgerEntry.save({ session });

    // 3. Update User reputation
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { reputation: appliedDelta } },
      { new: true, session }
    );

    if (!user) return null;

    // Reputation must not fall below 1
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

    // Compute trust level based on reputation & joined date
    user.trustLevel = computeTrustLevel(user.reputation, user.joinedOn);

    await user.save({ session });
    return user;
  } catch (error) {
    console.error("Error updating reputation and badges:", error);
    throw error;
  }
};
