import Flag from "../models/Flag.js";
import Questions from "../models/Questions.js";
import Answers from "../models/Answers.js";
import mongoose from "mongoose";

export const createFlag = async (req, res) => {
  const { targetType, targetId, questionId, reason, note } = req.body;
  const flaggedBy = req.userId;

  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return res.status(404).send("Invalid target ID");
  }

  try {
    const existing = await Flag.findOne({ flaggedBy, targetId });
    if (existing) {
      return res.status(409).json({ message: "You have already flagged this content." });
    }

    const flag = new Flag({
      targetType,
      targetId,
      questionId,
      flaggedBy,
      reason,
      note,
    });
    await flag.save();

    // Check if total open flags for this target is >= 3
    const flagCount = await Flag.countDocuments({ targetId, status: "open" });
    if (flagCount >= 3) {
      if (targetType === "question") {
        await Questions.findByIdAndUpdate(targetId, { $set: { status: "closed" } });
      } else if (targetType === "answer") {
        await Answers.findByIdAndUpdate(targetId, { $set: { hidden: true } });
      }
    }

    res.status(201).json({ message: "Content flagged successfully", flag });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to submit flag" });
  }
};

export const getFlags = async (req, res) => {
  try {
    const flags = await Flag.find({ status: "open" })
      .populate("flaggedBy", "name email")
      .populate("questionId", "questionTitle")
      .sort({ createdAt: -1 });

    res.status(200).json(flags);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch flags" });
  }
};

export const resolveFlag = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'actioned' or 'dismissed'
  const resolvedBy = req.userId;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("Invalid flag ID");
  }

  try {
    const flag = await Flag.findById(id);
    if (!flag) {
      return res.status(404).send("Flag not found");
    }

    flag.status = action;
    flag.resolvedBy = resolvedBy;
    flag.resolvedAt = Date.now();
    await flag.save();

    // If dismissed, check if we should restore content
    if (action === "dismissed") {
      const openFlags = await Flag.countDocuments({ targetId: flag.targetId, status: "open" });
      if (openFlags === 0) {
        if (flag.targetType === "question") {
          await Questions.findByIdAndUpdate(flag.targetId, { $set: { status: "open" } });
        } else if (flag.targetType === "answer") {
          await Answers.findByIdAndUpdate(flag.targetId, { $set: { hidden: false } });
        }
      }
    }

    res.status(200).json({ message: "Flag resolved successfully", flag });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to resolve flag" });
  }
};
