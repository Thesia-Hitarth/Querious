import React from "react";
import { Link } from "react-router-dom";
import "./NotFound.css";

const NotFound = () => {
  return (
    <div className="notfound-container">
      <div className="notfound-card">
        <div className="notfound-icon">🔍</div>
        <h1 className="notfound-title">404 — Page Not Found</h1>
        <p className="notfound-message">
          The page you are looking for doesn't exist or has been moved to another URL.
        </p>
        <Link to="/" className="btn btn-primary notfound-btn">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
