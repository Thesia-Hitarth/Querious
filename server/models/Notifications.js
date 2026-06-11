import mongoose from "mongoose";

const NotificationSchema = mongoose.Schema({
  userId: { type: String, required: true },
  message: { type: String, required: true },
  questionId: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Notification", NotificationSchema);
