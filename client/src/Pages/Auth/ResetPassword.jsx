import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as api from "../../api";
import "./Auth.css";
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

    setLoading(false);
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
      <div className="auth-container-2" style={{ padding: "30px", marginTop: "100px" }}>
        <h2>Reset Password</h2>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
          Please enter your new password below.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="newPassword">
            <h4>New Password</h4>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>
          <label htmlFor="confirmPassword">
            <h4>Confirm Password</h4>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ResetPassword;
