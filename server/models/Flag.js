import mongoose from "mongoose";

const FlagSchema = mongoose.Schema({
  targetType: {
    type: String,
    enum: ["question", "answer", "comment"],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
  },
  flaggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reason: {
    type: String,
    enum: ["spam", "offensive", "duplicate", "misleading", "other"],
    required: true,
  },
  note: {
    type: String,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ["open", "actioned", "dismissed"],
    default: "open",
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  resolvedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

FlagSchema.index({ targetId: 1, status: 1 });
FlagSchema.index({ flaggedBy: 1, targetId: 1 }, { unique: true });

export default mongoose.model("Flag", FlagSchema);
