import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import "./Auth.css";
import icon from "../../assets/icon.png";
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
      <div className="auth-container-2">
        <img src={icon} alt="stack overflow" className="login-logo" />
        
        {isForgotPassword ? (
          <div>
            <h3 style={{ textAlign: "center", marginBottom: "10px" }}>Reset Password</h3>
            {resetSent ? (
              <p style={{ fontSize: "14px", color: "green", textAlign: "center", lineHeight: "20px" }}>
                A password reset link has been successfully logged to the server console log. Please check your server terminal.
              </p>
            ) : (
              <p style={{ fontSize: "13px", color: "#666", textAlign: "center", marginBottom: "15px", lineHeight: "18px" }}>
                Enter your email address and we'll log a recovery link to the server console log.
              </p>
            )}
            
            {!resetSent && (
              <form onSubmit={handleSubmit}>
                <label htmlFor="email">
                  <h4>Email</h4>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                  />
                </label>
                <button type="submit" className="auth-btn" style={{ marginTop: "10px" }}>
                  Send Recovery Link
                </button>
              </form>
            )}
            
            <button
              type="button"
              className="handle-switch-btn"
              onClick={() => {
                setIsForgotPassword(false);
                setResetSent(false);
              }}
              style={{ display: "block", margin: "15px auto 0 auto", color: "#007ac6" }}
            >
              Back to Log in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {isSignup && (
              <label htmlFor="name">
                <h4>Display Name</h4>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                />
              </label>
            )}
            <label htmlFor="email">
              <h4>Email</h4>
              <input
                type="email"
                name="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
              />
            </label>
            <label htmlFor="password">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h4>Password</h4>
                {!isSignup && (
                  <p
                    style={{ color: "#007ac6", fontSize: "13px", cursor: "pointer" }}
                    onClick={handleForgotPasswordClick}
                  >
                    forgot password?
                  </p>
                )}
              </div>
              <input
                type="password"
                name="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
              />
            </label>
            <button type="submit" className="auth-btn">
              {isSignup ? "Sign up" : "Log in"}
            </button>
          </form>
        )}
        
        {!isForgotPassword && (
          <p>
            {isSignup ? "Already have an account?" : "Don't have an account?"}
            <button
              type="button"
              className="handle-switch-btn"
              onClick={handleSwitch}
            >
              {isSignup ? "Log in" : "sign up"}
            </button>
          </p>
        )}
      </div>
    </section>
  );
};

export default Auth;
