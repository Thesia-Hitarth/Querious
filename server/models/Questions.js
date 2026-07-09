import mongoose from "mongoose";

const QuestionSchema = mongoose.Schema({
  questionTitle: { type: String, required: "Question must have a title", minlength: 5, maxlength: 300 },
  questionBody: { type: String, required: "Question must have a body", minlength: 10, maxlength: 30000 },
  questionTags: { type: [{ type: String, maxlength: 50 }], required: "Question must have a tags" },
  noOfAnswers: { type: Number, default: 0 },
  upVote: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
  downVote: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
  userPosted: { type: String, required: "Question must have an author" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  askedOn: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  acceptedAnswerId: { type: mongoose.Schema.Types.ObjectId, ref: "Answer", default: null },
  editedOn: { type: Date, default: null },
  editedBy: { type: String, default: "" },
  status: { type: String, enum: ["open", "closed"], default: "open" },
  comments: [
    {
      commentBody: { type: String, required: true, minlength: 2, maxlength: 600 },
      userId: String,
      userCommented: String,
      commentedOn: { type: Date, default: Date.now },
    },
  ],
  watchers: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
});

QuestionSchema.index({ questionTitle: "text", questionBody: "text" });
QuestionSchema.index({ userId: 1, askedOn: -1 });

export default mongoose.model("Question", QuestionSchema);
