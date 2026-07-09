import mongoose from "mongoose";

const PendingDigestSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("PendingDigest", PendingDigestSchema);
