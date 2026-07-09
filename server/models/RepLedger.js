import mongoose from "mongoose";

const RepLedgerSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  repDelta: { type: Number, required: true }, // The actual reputation change applied
  originalDelta: { type: Number, required: true }, // The requested change before cap
  action: { type: String, required: true }, // e.g. 'upvote_received', 'answer_accepted'
  sourceId: { type: mongoose.Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now },
});

RepLedgerSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("RepLedger", RepLedgerSchema);
