import express from "express";

import {
  postAnswer,
  deleteAnswer,
  voteAnswer,
  acceptAnswer,
  updateAnswer,
  addCommentAnswer,
  deleteCommentAnswer,
  flagOutdated,
  clearOutdatedFlags,
} from "../controllers/Answers.js";
import auth from "../middleware/auth.js";
import { answerValidationRules, commentValidationRules } from "../middleware/validation.js";

const router = express.Router();

router.post("/post/:id", auth, answerValidationRules, postAnswer);
router.delete("/:id", auth, deleteAnswer);
router.post("/:id/vote", auth, voteAnswer);
router.patch("/:id/accept", auth, acceptAnswer);
router.put("/:id", auth, answerValidationRules, updateAnswer);
router.post("/:id/comment", auth, commentValidationRules, addCommentAnswer);
router.delete("/:id/comment/:commentId", auth, deleteCommentAnswer);
router.post("/:id/outdated", auth, flagOutdated);
router.delete("/:id/outdated", auth, clearOutdatedFlags);

export default router;
