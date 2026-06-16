import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import * as api from "../../api";
import "./Auth.css";
import icon from "../../assets/Only-Symbol.png";
import { useToast } from "../../components/Toast/ToastContext";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showToast("Please enter all password fields", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters long", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    try {
      setLoading(true);
      await api.resetPassword(token, newPassword);
      showToast("Password has been reset successfully! Redirecting...", "success");
      navigate("/Auth");
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || "Failed to reset password.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section">
      <motion.div
        className="auth-card-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="auth-card-logo">
          <img src={icon} alt="Querious" />
          <span>
            <span className="auth-card-logo-text-accent">Q</span>
            <span className="auth-card-logo-text">uerious</span>
          </span>
        </div>

        <h3 className="auth-heading">Reset Password</h3>
        <p className="forgot-hint-text" style={{ textAlign: "center", marginBottom: "var(--space-4)" }}>
          Please enter and confirm your new password below.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
            />
          </div>
          <div className="form-group" style={{ marginTop: "var(--space-2)" }}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
            />
          </div>
          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </motion.div>
    </section>
  );
};

export default ResetPassword;
