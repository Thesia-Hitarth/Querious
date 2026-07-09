import Questions from "../models/Questions.js";
import Answers from "../models/Answers.js";
import User from "../models/auth.js";
import Flag from "../models/Flag.js";
import SuggestedEdit from "../models/SuggestedEdit.js";

export const getAdminStats = async (req, res) => {
  try {
    const [
      totalQuestions,
      totalAnswers,
      totalUsers,
      pendingFlags,
      pendingEdits,
    ] = await Promise.all([
      Questions.countDocuments(),
      Answers.countDocuments(),
      User.countDocuments(),
      Flag.countDocuments({ status: "open" }),
      SuggestedEdit.countDocuments({ status: "pending" }),
    ]);

    // Group users by trustLevel
    const trustGroups = await User.aggregate([
      {
        $group: {
          _id: "$trustLevel",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          trustLevel: "$_id",
          count: 1,
        },
      },
      { $sort: { trustLevel: 1 } },
    ]);

    // Ensure all trust levels (0-4) are represented
    const trustLevels = [0, 1, 2, 3, 4];
    const trustStats = trustLevels.map((lvl) => {
      const found = trustGroups.find((g) => g.trustLevel === lvl);
      return {
        level: lvl,
        label: getTrustLevelLabel(lvl),
        count: found ? found.count : 0,
      };
    });

    res.status(200).json({
      totalQuestions,
      totalAnswers,
      totalUsers,
      pendingFlags,
      pendingEdits,
      trustStats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load admin stats" });
  }
};

const getTrustLevelLabel = (level) => {
  switch (level) {
    case 4:
      return "Leader (Trust 4)";
    case 3:
      return "Regular (Trust 3)";
    case 2:
      return "Member (Trust 2)";
    case 1:
      return "Basic User (Trust 1)";
    default:
      return "New User (Trust 0)";
  }
};
