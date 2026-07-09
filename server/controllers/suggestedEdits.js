import mongoose from "mongoose";
import SuggestedEdit from "../models/SuggestedEdit.js";
import Questions from "../models/Questions.js";
import Answers from "../models/Answers.js";
import User from "../models/auth.js";
import { updateReputationAndBadges } from "../utils/reputationHelper.js";
import { sendNotification } from "../utils/notificationHelper.js";

export const getSuggestedEdits = async (req, res) => {
  try {
    const edits = await SuggestedEdit.find({ status: "pending" })
      .populate("suggestedBy", "name reputation")
      .sort({ createdAt: 1 });

    res.status(200).json(edits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch suggested edits" });
  }
};

export const approveSuggestedEdit = async (req, res) => {
  const { id } = req.params;
  const reviewerId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("Suggested edit unavailable...");
  }

  try {
    const edit = await SuggestedEdit.findById(id);
    if (!edit || edit.status !== "pending") {
      return res.status(404).send("Pending suggested edit not found...");
    }

    const reviewer = await User.findById(reviewerId);
    const hasPrivilege = reviewer?.isAdmin || (reviewer?.reputation || 0) >= 2000;
    if (!hasPrivilege) {
      return res.status(403).json({ message: "You need 2,000+ reputation or admin status to review edits." });
    }

    // Apply the edit to the target
    if (edit.targetType === "question") {
      const q = await Questions.findById(edit.targetId);
      if (!q) {
        return res.status(404).send("Target question not found");
      }
      q.questionTitle = edit.title || q.questionTitle;
      q.questionBody = edit.body;
      if (edit.tags && edit.tags.length > 0) {
        q.questionTags = edit.tags;
      }
      q.editedOn = Date.now();
      q.editedBy = reviewer.name;
      await q.save();
    } else {
      const a = await Answers.findById(edit.targetId);
      if (!a) {
        return res.status(404).send("Target answer not found");
      }
      a.answerBody = edit.body;
      a.editedOn = Date.now();
      await a.save();
    }

    // Update edit status
    edit.status = "approved";
    edit.reviewedBy = reviewerId;
    edit.reviewedAt = Date.now();
    await edit.save();

    // Award suggester +2 reputation
    await updateReputationAndBadges(edit.suggestedBy, 2, "suggested_edit_approved", edit._id);

    // Notify suggester
    await sendNotification(
      edit.suggestedBy,
      `🎉 Your suggested edit for a ${edit.targetType} was approved (+2 reputation).`,
      edit.targetType === "question" ? edit.targetId : null,
      "badge"
    );

    res.status(200).json(edit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to approve suggested edit" });
  }
};

export const rejectSuggestedEdit = async (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;
  const reviewerId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("Suggested edit unavailable...");
  }

  try {
    const edit = await SuggestedEdit.findById(id);
    if (!edit || edit.status !== "pending") {
      return res.status(404).send("Pending suggested edit not found...");
    }

    const reviewer = await User.findById(reviewerId);
    const hasPrivilege = reviewer?.isAdmin || (reviewer?.reputation || 0) >= 2000;
    if (!hasPrivilege) {
      return res.status(403).json({ message: "You need 2,000+ reputation or admin status to review edits." });
    }

    edit.status = "rejected";
    edit.rejectionReason = rejectionReason || "No reason specified";
    edit.reviewedBy = reviewerId;
    edit.reviewedAt = Date.now();
    await edit.save();

    // Notify suggester
    await sendNotification(
      edit.suggestedBy,
      `❌ Your suggested edit was rejected: ${edit.rejectionReason}`,
      edit.targetType === "question" ? edit.targetId : null,
      "system"
    );

    res.status(200).json(edit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to reject suggested edit" });
  }
};
