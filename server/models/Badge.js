import mongoose from "mongoose";

const BadgeSchema = mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  tier: { type: String, enum: ["gold", "silver", "bronze"], required: true },
  triggerType: { type: String, required: true },
});

export default mongoose.model("Badge", BadgeSchema);
