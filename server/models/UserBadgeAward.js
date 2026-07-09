import mongoose from "mongoose";

const UserBadgeAwardSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  badgeCode: { type: String, required: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId },
  awardedAt: { type: Date, default: Date.now },
});

UserBadgeAwardSchema.index({ userId: 1, badgeCode: 1, sourceId: 1 }, { unique: true });
UserBadgeAwardSchema.index({ userId: 1, awardedAt: -1 });

export default mongoose.model("UserBadgeAward", UserBadgeAwardSchema);
