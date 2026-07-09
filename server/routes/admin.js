import express from "express";
import { getAdminStats } from "../controllers/admin.js";
import auth from "../middleware/auth.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

router.get("/stats", auth, requireAdmin, getAdminStats);

export default router;
