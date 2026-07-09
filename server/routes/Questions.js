import express from "express";

import {
  AskQuestion,
  getAllQuestions,
  getQuestionDetails,
  deleteQuestion,
  voteQuestion,
  getTagsAggregation,
  updateQuestion,
  addCommentQuestion,
  deleteCommentQuestion,
  getRelatedQuestions,
  toggleWatchQuestion,
} from "../controllers/Questions.js";
import auth from "../middleware/auth.js";
import { questionValidationRules, commentValidationRules } from "../middleware/validation.js";

const router = express.Router();

router.post("/Ask", auth, questionValidationRules, AskQuestion);
router.get("/get", getAllQuestions);
router.get("/tags", getTagsAggregation);
router.get("/get/:id", getQuestionDetails);
router.delete("/delete/:id", auth, deleteQuestion);
router.patch("/vote/:id", auth, voteQuestion);
router.put("/:id", auth, questionValidationRules, updateQuestion);
router.post("/:id/comment", auth, commentValidationRules, addCommentQuestion);
router.delete("/:id/comment/:commentId", auth, deleteCommentQuestion);
router.get("/:id/related", getRelatedQuestions);
router.post("/:id/watch", auth, toggleWatchQuestion);

export default router;
