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

  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (!pwd) return { score, text: "", color: "" };
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    
    let text = "Weak";
    let color = "#e05151";
    if (score === 3) {
      text = "Medium";
      color = "#ffac38";
    } else if (score === 4) {
      text = "Strong";
      color = "#2ecc71";
    }
    return { score, text, color };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showToast("Please enter all password fields", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters long", "error");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      showToast("Password must contain at least one uppercase letter", "error");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      showToast("Password must contain at least one number", "error");
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
              placeholder="Minimum 8 characters"
            />
            {newPassword && (
              <div className="password-strength-meter" style={{ marginTop: "10px" }}>
                <div className="strength-bar-bg" style={{ background: "rgba(255, 255, 255, 0.1)", height: "6px", borderRadius: "3px", overflow: "hidden", display: "flex" }}>
                  <div className="strength-bar-fill" style={{ 
                    width: `${(getPasswordStrength(newPassword).score / 4) * 100}%`, 
                    background: getPasswordStrength(newPassword).color, 
                    height: "100%", 
                    transition: "width 0.3s ease" 
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                  <span style={{ fontSize: "12px", color: getPasswordStrength(newPassword).color, fontWeight: "600" }}>
                    Strength: {getPasswordStrength(newPassword).text}
                  </span>
                </div>
                <ul className="password-requirements" style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "8px", paddingLeft: "16px", margin: "8px 0 0 0", textAlign: "left" }}>
                  <li style={{ color: newPassword.length >= 8 ? "#2ecc71" : "inherit", transition: "color 0.2s" }}>At least 8 characters</li>
                  <li style={{ color: /[A-Z]/.test(newPassword) ? "#2ecc71" : "inherit", transition: "color 0.2s" }}>At least one uppercase letter</li>
                  <li style={{ color: /[0-9]/.test(newPassword) ? "#2ecc71" : "inherit", transition: "color 0.2s" }}>At least one number</li>
                </ul>
              </div>
            )}
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
