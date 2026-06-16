import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  about: { type: String },
  tags: { type: [String] },
  reputation: { type: Number, default: 1 },
  badges: {
    gold: { type: Number, default: 0 },
    silver: { type: Number, default: 0 },
    bronze: { type: Number, default: 0 },
  },
  avatar: { type: String, default: "" },
  location: { type: String, default: "" },
  website: { type: String, default: "" },
  savedQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  joinedOn: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
