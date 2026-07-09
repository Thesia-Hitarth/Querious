import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import users from "../models/auth.js";
import { sendResetEmail } from "../utils/mailHelper.js";

export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existinguser = await users.findOne({ email });
    if (existinguser) {
      return res.status(409).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await users.create({
      name,
      email,
      password: hashedPassword,
    });
    const token = jwt.sign(
      { email: newUser.email, id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.status(201).json({ result: newUser, token });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong..." });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existinguser = await users.findOne({ email });
    if (!existinguser) {
      return res.status(404).json({ message: "User doesn't exist." });
    }

    if (existinguser.lockUntil && existinguser.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((existinguser.lockUntil - Date.now()) / (60 * 1000));
      return res.status(423).json({ message: `Account is temporarily locked. Try again in ${remainingTime} minutes.` });
    }

    const isPasswordCrt = await bcrypt.compare(password, existinguser.password);
    if (!isPasswordCrt) {
      existinguser.loginAttempts = (existinguser.loginAttempts || 0) + 1;
      if (existinguser.loginAttempts >= 5) {
        existinguser.lockUntil = Date.now() + 15 * 60 * 1000;
        await existinguser.save();
        return res.status(423).json({ message: "Too many failed attempts. Account locked for 15 minutes." });
      }
      await existinguser.save();
      return res.status(400).json({ message: "Invalid credentials" });
    }

    existinguser.loginAttempts = 0;
    existinguser.lockUntil = undefined;
    await existinguser.save();

    const token = jwt.sign(
      { email: existinguser.email, id: existinguser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.status(200).json({ result: existinguser, token });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong..." });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await users.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "If an account exists with this email, a reset link has been sent." });
    }

    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    if (user.forgotPasswordWindowStart && (now - user.forgotPasswordWindowStart) < oneHour) {
      if (user.forgotPasswordCount >= 5) {
        return res.status(429).json({ message: "Too many password reset requests. Please try again after an hour." });
      }
      user.forgotPasswordCount += 1;
    } else {
      user.forgotPasswordWindowStart = now;
      user.forgotPasswordCount = 1;
    }
    await user.save();

    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const hashedToken = await bcrypt.hash(resetToken, 10);
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const clientUrl = process.env.CLIENT_URL || process.env.REACT_APP_CLIENT_URL || "http://localhost:3000";
    const resetLink = `${clientUrl}/reset-password/${resetToken}`;

    await sendResetEmail(email, resetLink);

    res.status(200).json({ message: "If an account exists with this email, a reset link has been sent." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong..." });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired." });
    }

    const user = await users.findById(decoded.id);
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      return res.status(400).json({ message: "Password reset request is invalid or has expired." });
    }

    if (Date.now() > user.resetPasswordExpires) {
      return res.status(400).json({ message: "Password reset token has expired." });
    }

    const isTokenMatch = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isTokenMatch) {
      return res.status(400).json({ message: "Password reset token is invalid." });
    }

    // Invalidate the token AND update the password in a single atomic save.
    // Two sequential saves created a window where a server crash after the
    // first save would clear the token but leave the old password, locking
    // the user out with no way to reset again.
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordChangedAt = new Date();
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong..." });
  }
};

export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.userId;

  try {
    const user = await users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordChangedAt = new Date();
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Something went wrong..." });
  }
};
