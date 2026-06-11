import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as api from "../../api";
import "./Auth.css";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      alert("Please enter password fields");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(false);
    try {
      setLoading(true);
      await api.resetPassword(token, newPassword);
      alert("Password has been reset successfully! Redirecting to login...");
      navigate("/Auth");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to reset password.");
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
