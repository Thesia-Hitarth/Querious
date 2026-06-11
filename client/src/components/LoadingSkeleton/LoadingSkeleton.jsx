import React from "react";
import "./LoadingSkeleton.css";

const LoadingSkeleton = ({ type = "question-list", count = 3 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case "question-list":
        return (
          <div className="skeleton-question-list">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="skeleton-question-card shimmer">
                <div className="skeleton-votes-stats">
                  <div className="skeleton-stat-box"></div>
                  <div className="skeleton-stat-box"></div>
                </div>
                <div className="skeleton-question-details">
                  <div className="skeleton-title-line"></div>
                  <div className="skeleton-body-line"></div>
                  <div className="skeleton-tags-row">
                    <div className="skeleton-tag-chip"></div>
                    <div className="skeleton-tag-chip"></div>
                    <div className="skeleton-tag-chip"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case "question-detail":
        return (
          <div className="skeleton-question-detail shimmer">
            <div className="skeleton-header-line"></div>
            <div className="skeleton-meta-row">
              <div className="skeleton-meta-item"></div>
              <div className="skeleton-meta-item"></div>
            </div>
            <div className="skeleton-content-section">
              <div className="skeleton-vote-bar">
                <div className="skeleton-vote-arrow"></div>
                <div className="skeleton-vote-score"></div>
                <div className="skeleton-vote-arrow"></div>
              </div>
              <div className="skeleton-body-content">
                <div className="skeleton-body-line-large"></div>
                <div className="skeleton-body-line-large"></div>
                <div className="skeleton-body-line-medium"></div>
              </div>
            </div>
          </div>
        );
      case "user-card":
        return (
          <div className="skeleton-user-grid">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="skeleton-user-card shimmer">
                <div className="skeleton-avatar"></div>
                <div className="skeleton-user-info">
                  <div className="skeleton-username-line"></div>
                  <div className="skeleton-user-meta-line"></div>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div className="skeleton-generic shimmer">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="skeleton-generic-line"></div>
            ))}
          </div>
        );
    }
  };

  return <div className="skeleton-container">{renderSkeleton()}</div>;
};

export default LoadingSkeleton;
