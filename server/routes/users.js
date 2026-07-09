import express from "express";

import { login, signup, forgotPassword, resetPassword, changePassword } from "../controllers/auth.js";
import { getAllUsers, updateProfile, getUserDetails, toggleSaveQuestion, getUserBadges, getUserReputationHistory } from "../controllers/users.js";
import auth from "../middleware/auth.js";
import { signupValidationRules, loginValidationRules, userUpdateValidationRules, resetPasswordValidationRules, changePasswordValidationRules } from "../middleware/validation.js";

const router = express.Router();

router.post("/signup", signupValidationRules, signup);
router.post("/login", loginValidationRules, login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPasswordValidationRules, resetPassword);

router.get("/getAllUsers", getAllUsers);
router.get("/:id", getUserDetails);
router.get("/:id/badges", getUserBadges);
router.get("/:id/reputation", getUserReputationHistory);
router.patch("/update/:id", auth, userUpdateValidationRules, updateProfile);
router.post("/:id/save", auth, toggleSaveQuestion);
router.put("/change-password", auth, changePasswordValidationRules, changePassword);

export default router;
