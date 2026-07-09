import mongoose from "mongoose";

const SuggestedEditSchema = mongoose.Schema({
  targetType: { type: String, enum: ["question", "answer"], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  suggestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String }, // Questions only
  body: { type: String, required: true },
  tags: { type: [String] }, // Questions only
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rejectionReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
});

export default mongoose.model("SuggestedEdit", SuggestedEditSchema);
