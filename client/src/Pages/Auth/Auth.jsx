import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";

import "./Auth.css";
import icon from "../../assets/Only-Symbol.png";
import AboutAuth from "./AboutAuth";
import { signup, login } from "../../actions/auth";
import * as api from "../../api";

const Auth = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

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
        alert("Please enter your email");
        return;
      }
      try {
        await api.forgotPassword(email);
        setResetSent(true);
      } catch (error) {
        console.error(error);
        alert(error.response?.data?.message || "Something went wrong.");
      }
      return;
    }

    if (!email || !password) {
      alert("Enter email and password");
      return;
    }
    if (isSignup) {
      if (!name) {
        alert("Enter a name to continue");
        return;
      }
      dispatch(signup({ name, email, password }, navigate));
    } else {
      dispatch(login({ email, password }, navigate));
    }
  };

  return (
    <section className="auth-section">
      {isSignup && !isForgotPassword && <AboutAuth />}
      
      <div className="auth-card-container">
        <div className="auth-card-logo">
          <img src={icon} alt="Querious" />
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
                A password reset link has been successfully logged to the server console log. Please check your server terminal.
              </p>
            ) : (
              <p className="forgot-hint-text">
                Enter your email address and we'll log a recovery link to the server console log.
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
                  <span className="forgot-link" onClick={handleForgotPasswordClick}>
                    Forgot password?
                  </span>
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
            <span className="auth-toggle-link" onClick={handleSwitch}>
              {isSignup ? "Log in" : "Sign up"}
            </span>
          </p>
        )}
      </div>
    </section>
  );
};

export default Auth;
