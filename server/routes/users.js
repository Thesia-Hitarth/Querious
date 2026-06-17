import express from "express";

import { login, signup, forgotPassword, resetPassword } from "../controllers/auth.js";
import { getAllUsers, updateProfile, getUserDetails, toggleSaveQuestion } from "../controllers/users.js";
import auth from "../middleware/auth.js";
import { signupValidationRules, loginValidationRules, userUpdateValidationRules } from "../middleware/validation.js";

const router = express.Router();

router.post("/signup", signupValidationRules, signup);
router.post("/login", loginValidationRules, login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/getAllUsers", getAllUsers);
router.get("/:id", getUserDetails);
router.patch("/update/:id", auth, userUpdateValidationRules, updateProfile);
router.post("/:id/save", auth, toggleSaveQuestion);

export default router;
