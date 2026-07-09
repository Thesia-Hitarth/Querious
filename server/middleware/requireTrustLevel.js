import User from "../models/auth.js";

/**
 * Middleware factory that gates a route by minimum trust level.
 * Usage: router.post('/flags', auth, requireTrustLevel(1), flagController)
 *
 * Trust levels:
 *   0 – New User (read + ask questions)
 *   1 – Basic User (answer, comment, flag)
 *   2 – Member (suggest edits without rep gate)
 *   3 – Regular (retag, close duplicates)
 *   4 – Leader / Admin equivalent
 */
export const requireTrustLevel = (minLevel) => async (req, res, next) => {
  try {
    // req.userId is set by the auth middleware that must run before this one
    if (!req.userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const user = await User.findById(req.userId, "trustLevel isAdmin");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Admins always pass trust-level checks
    if (user.isAdmin) {
      return next();
    }

    const userLevel = user.trustLevel ?? 0;
    if (userLevel < minLevel) {
      return res.status(403).json({
        message: `Insufficient trust level. Required: ${minLevel}, yours: ${userLevel}. Keep participating to increase your trust level.`,
      });
    }

    next();
  } catch (error) {
    console.error("requireTrustLevel error:", error);
    res.status(500).json({ message: "Internal server error during trust level check." });
  }
};

export default requireTrustLevel;
