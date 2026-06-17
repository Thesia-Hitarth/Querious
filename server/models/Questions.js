import mongoose from "mongoose";

const QuestionSchema = mongoose.Schema({
  questionTitle: { type: String, required: "Question must have a title", minlength: 5, maxlength: 300 },
  questionBody: { type: String, required: "Question must have a body", minlength: 10, maxlength: 30000 },
  questionTags: { type: [{ type: String, maxlength: 50 }], required: "Question must have a tags" },
  noOfAnswers: { type: Number, default: 0 },
  upVote: { type: [String], default: [] },
  downVote: { type: [String], default: [] },
  userPosted: { type: String, required: "Question must have an author" },
  userId: { type: String },
  askedOn: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  acceptedAnswerId: { type: String, default: null },
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
});

QuestionSchema.index({ questionTitle: "text", questionBody: "text" });

export default mongoose.model("Question", QuestionSchema);
