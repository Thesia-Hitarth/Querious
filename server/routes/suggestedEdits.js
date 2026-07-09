import express from "express";
import { getSuggestedEdits, approveSuggestedEdit, rejectSuggestedEdit } from "../controllers/suggestedEdits.js";
import auth from "../middleware/auth.js";
import { requireTrustLevel } from "../middleware/requireTrustLevel.js";

const router = express.Router();

// Phase 7: requireTrustLevel(2) to view/review queue; regular users can see their own suggestions but reviewing needs TL2+
router.get("/", auth, requireTrustLevel(2), getSuggestedEdits);
router.post("/:id/approve", auth, requireTrustLevel(2), approveSuggestedEdit);
router.post("/:id/reject", auth, requireTrustLevel(2), rejectSuggestedEdit);

export default router;
