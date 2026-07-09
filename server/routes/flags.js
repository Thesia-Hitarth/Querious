import express from "express";
import { createFlag, getFlags, resolveFlag } from "../controllers/flags.js";
import auth from "../middleware/auth.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

router.post("/", auth, createFlag);
router.get("/", auth, requireAdmin, getFlags);
router.patch("/:id", auth, requireAdmin, resolveFlag);

export default router;
