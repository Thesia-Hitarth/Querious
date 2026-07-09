import React from "react";
import "./CollectiveIcon.css";

const CollectiveIcon = ({ name, iconClass, size = 40 }) => {
  return (
    <div
      className={`collective-icon ${iconClass}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        borderRadius: size <= 40 ? "var(--radius-sm)" : "var(--radius-md)"
      }}
    >
      {name.substring(0, 3).toUpperCase()}
    </div>
  );
};

export default CollectiveIcon;
