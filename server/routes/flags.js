import express from "express";
import { createFlag, getFlags, resolveFlag } from "../controllers/flags.js";
import auth from "../middleware/auth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import { requireTrustLevel } from "../middleware/requireTrustLevel.js";

const router = express.Router();

// Phase 7: requireTrustLevel(1) — New users (TL0) cannot flag; Basic users (TL1+) can
router.post("/", auth, requireTrustLevel(1), createFlag);
router.get("/", auth, requireAdmin, getFlags);
router.patch("/:id", auth, requireAdmin, resolveFlag);

export default router;
