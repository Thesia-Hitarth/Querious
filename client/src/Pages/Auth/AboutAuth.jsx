import React from "react";

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const AboutAuth = () => {
  const features = [
    { icon: "❓", text: "Get unstuck — ask a question" },
    { icon: "🗳️", text: "Unlock new privileges like voting and commenting" },
    { icon: "🔖", text: "Save your favorite tags and bookmarks" },
    { icon: "🏆", text: "Earn reputation and badges" },
    { icon: "🤝", text: "Collaborate and share knowledge" },
  ];

  return (
    <div className="auth-container-1">
      <h1>
        Join the{" "}
        <span className="auth-brand-word">Querious</span>{" "}
        community
      </h1>
      {features.map(({ icon, text }) => (
        <p key={text}>
          <span className="auth-feature-icon" aria-hidden="true">
            <CheckIcon />
          </span>
          {text}
        </p>
      ))}
    </div>
  );
};

export default AboutAuth;
