import mongoose from "mongoose";

const AnswerSchema = mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  answerBody: { type: String, required: true, minlength: 5, maxlength: 30000 },
  userId: { type: String },
  userAnswered: { type: String },
  upVote: { type: [String], default: [] },
  downVote: { type: [String], default: [] },
  isAccepted: { type: Boolean, default: false },
  answeredOn: { type: Date, default: Date.now },
  editedOn: { type: Date, default: null },
  comments: [
    {
      commentBody: { type: String, required: true, minlength: 2, maxlength: 600 },
      userId: String,
      userCommented: String,
      commentedOn: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.model("Answer", AnswerSchema);
