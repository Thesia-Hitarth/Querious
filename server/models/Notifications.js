import mongoose from "mongoose";

const NotificationSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: false, default: null },
  category: {
    type: String,
    enum: ["answer", "comment", "vote", "accept", "mention", "badge", "system"],
    default: "system",
  },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Index on userId + createdAt so the per-user poll query (runs every ~30s) never
// degrades into a full collection scan as the notifications collection grows.
NotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Notification", NotificationSchema);
