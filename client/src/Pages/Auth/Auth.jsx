import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import "./Auth.css";
import icon from "../../assets/Only-Symbol.png";
import AboutAuth from "./AboutAuth";
import { signup, login } from "../../actions/auth";
import * as api from "../../api";
import { useToast } from "../../components/Toast/ToastContext";

const Auth = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const from = location.state?.from?.pathname || "/";
  const redirectMessage = location.state?.message;

  useEffect(() => {
    if (redirectMessage) {
      showToast(redirectMessage, "warning");
      window.history.replaceState({}, document.title);
    }
  }, [redirectMessage, showToast]);

  const handleSwitch = () => {
    setIsSignup(!isSignup);
    setIsForgotPassword(false);
    setResetSent(false);
    setName("");
    setEmail("");
    setPassword("");
  };

  const handleForgotPasswordClick = () => {
    setIsForgotPassword(true);
    setResetSent(false);
    setEmail("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isForgotPassword) {
      if (!email) {
        showToast("Please enter your email", "error");
        return;
      }
      try {
        await api.forgotPassword(email);
        setResetSent(true);
        showToast("Password reset link has been sent to your email", "success");
      } catch (error) {
        console.error(error);
        showToast(error.response?.data?.message || "Something went wrong.", "error");
      }
      return;
    }

    if (!email || !password) {
      showToast("Please enter email and password", "error");
      return;
    }
    try {
      if (isSignup) {
        if (!name) {
          showToast("Please enter a name to continue", "error");
          return;
        }
        await dispatch(signup({ name, email, password }, navigate, from));
        showToast("Account created successfully!", "success");
      } else {
        await dispatch(login({ email, password }, navigate, from));
        showToast("Logged in successfully!", "success");
      }
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || "Authentication failed. Please verify your credentials.", "error");
    }
  };

  return (
    <section className="auth-section">
      {isSignup && !isForgotPassword && <AboutAuth />}
      
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

        {/* Tab Switcher Header (Section 8) */}
        {!isForgotPassword && (
          <div className="auth-tab-switcher">
            <button
              type="button"
              className={`auth-tab ${!isSignup ? "active" : ""}`}
              onClick={() => {
                setIsSignup(false);
                setIsForgotPassword(false);
              }}
            >
              Log in
            </button>
            <button
              type="button"
              className={`auth-tab ${isSignup ? "active" : ""}`}
              onClick={() => {
                setIsSignup(true);
                setIsForgotPassword(false);
              }}
            >
              Sign up
            </button>
          </div>
        )}

        {isForgotPassword ? (
          <div className="forgot-password-flow">
            <h3 className="auth-heading">Reset Password</h3>
            {resetSent ? (
              <p className="forgot-success-text">
                A password reset link has been successfully sent to your email inbox. Please check your email.
              </p>
            ) : (
              <p className="forgot-hint-text">
                Enter your email address and we'll send a password recovery link to your inbox.
              </p>
            )}
            
            {!resetSent && (
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-auth-submit">
                  Send Recovery Link
                </button>
              </form>
            )}
            
            <button
              type="button"
              className="back-login-btn"
              onClick={() => {
                setIsForgotPassword(false);
                setResetSent(false);
              }}
            >
              Back to Log in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <h2 className="auth-heading">
              {isSignup ? "Join Querious" : "Welcome back"}
            </h2>
            
            {isSignup && (
              <div className="form-group">
                <label htmlFor="name">Display Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                name="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div className="password-label-row">
                <label htmlFor="password">Password</label>
                {!isSignup && (
                  <button type="button" className="forgot-link" onClick={handleForgotPasswordClick}>
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                name="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-auth-submit">
              {isSignup ? "Sign up" : "Log in"}
            </button>
          </form>
        )}
        
        {!isForgotPassword && (
          <p className="auth-footer-toggle">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <button type="button" className="auth-toggle-link" onClick={handleSwitch}>
              {isSignup ? "Log in" : "Sign up"}
            </button>
          </p>
        )}
      </motion.div>
    </section>
  );
};

export default Auth;
