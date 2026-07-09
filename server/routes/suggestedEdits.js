import express from "express";
import { getSuggestedEdits, approveSuggestedEdit, rejectSuggestedEdit } from "../controllers/suggestedEdits.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getSuggestedEdits);
router.post("/:id/approve", auth, approveSuggestedEdit);
router.post("/:id/reject", auth, rejectSuggestedEdit);

export default router;
