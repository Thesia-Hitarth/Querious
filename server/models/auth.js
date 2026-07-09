import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, maxlength: 256 },
  password: { type: String, required: true, maxlength: 100 },
  about: { type: String, maxlength: 500 },
  tags: { type: [{ type: String, maxlength: 50 }] },
  reputation: { type: Number, default: 1 },
  badges: {
    gold: { type: Number, default: 0 },
    silver: { type: Number, default: 0 },
    bronze: { type: Number, default: 0 },
  },
  avatar: { type: String, default: "" },
  location: { type: String, default: "" , maxlength: 100 },
  website: { type: String, default: "" , maxlength: 200 },
  savedQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  collectives: { type: [String], default: [] },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  passwordChangedAt: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  forgotPasswordCount: { type: Number, default: 0 },
  forgotPasswordWindowStart: { type: Date },
  joinedOn: { type: Date, default: Date.now },
}, { timestamps: true });

const stripSensitiveFields = (_doc, ret) => {
  delete ret.password;
  delete ret.resetPasswordToken;
  delete ret.resetPasswordExpires;
  delete ret.loginAttempts;
  delete ret.lockUntil;
  delete ret.forgotPasswordCount;
  delete ret.forgotPasswordWindowStart;
  return ret;
};

userSchema.set("toJSON", { transform: stripSensitiveFields });
userSchema.set("toObject", { transform: stripSensitiveFields });

export default mongoose.model("User", userSchema);
