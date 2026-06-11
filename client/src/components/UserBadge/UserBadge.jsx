import React from "react";
import { useSelector } from "react-redux";
import "./UserBadge.css";

const UserBadge = ({ userId, showRepOnly = false }) => {
  const users = useSelector((state) => state.usersReducer) || [];
  const user = users.find((u) => u._id === userId);

  if (!user) return null;

  const reputation = user.reputation || 1;

  // Compute badges based on reputation
  const gold = Math.floor(reputation / 500);
  const silver = Math.floor((reputation % 500) / 100);
  const bronze = Math.floor((reputation % 100) / 20);

  if (showRepOnly) {
    return <span className="user-reputation-only">{reputation}</span>;
  }

  return (
    <span className="user-badge-container">
      <span className="user-reputation" title={`Reputation: ${reputation}`}>
        {reputation}
      </span>
      {gold > 0 && (
        <span className="badge-circle gold" title={`${gold} gold badges`}>
          <span className="circle-dot">●</span>
          <span className="badge-count">{gold}</span>
        </span>
      )}
      {silver > 0 && (
        <span className="badge-circle silver" title={`${silver} silver badges`}>
          <span className="circle-dot">●</span>
          <span className="badge-count">{silver}</span>
        </span>
      )}
      {bronze > 0 && (
        <span className="badge-circle bronze" title={`${bronze} bronze badges`}>
          <span className="circle-dot">●</span>
          <span className="badge-count">{bronze}</span>
        </span>
      )}
    </span>
  );
};

export default UserBadge;
