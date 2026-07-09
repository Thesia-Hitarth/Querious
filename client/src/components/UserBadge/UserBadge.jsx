import React from "react";
import { useSelector } from "react-redux";
import "./UserBadge.css";

const UserBadge = ({ userId, user, reputation, badges, showRepOnly = false }) => {
  const users = useSelector((state) => state.usersReducer.data) || [];
  
  let finalRep = reputation;
  let finalBadges = badges;

  if (user) {
    finalRep = user.reputation;
    finalBadges = user.badges;
  } else if (finalRep === undefined) {
    const listUser = users.find((u) => u._id === userId);
    if (listUser) {
      finalRep = listUser.reputation;
      finalBadges = listUser.badges;
    }
  }

  if (finalRep === undefined) return null;

  const reputationValue = finalRep || 1;

  // Compute badges based on reputation (fallback for legacy or if badges not provided)
  const gold = finalBadges ? (finalBadges.gold || 0) : Math.floor(reputationValue / 500);
  const silver = finalBadges ? (finalBadges.silver || 0) : Math.floor((reputationValue % 500) / 100);
  const bronze = finalBadges ? (finalBadges.bronze || 0) : Math.floor((reputationValue % 100) / 20);

  if (showRepOnly) {
    return <span className="user-reputation-only">{reputationValue}</span>;
  }

  return (
    <span className="user-badge-container">
      <span className="user-reputation" title={`Reputation: ${reputationValue}`}>
        {reputationValue}
      </span>
      {gold > 0 && (
        <span className="badge-circle gold" title={`${gold} Gold Badges (Top-tier contributions like questions or answers reaching high scores)`}>
          <span className="circle-dot">●</span>
          <span className="badge-count">{gold}</span>
        </span>
      )}
      {silver > 0 && (
        <span className="badge-circle silver" title={`${silver} Silver Badges (High-quality participation, accepted answers, or voting civic duty)`}>
          <span className="circle-dot">●</span>
          <span className="badge-count">{silver}</span>
        </span>
      )}
      {bronze > 0 && (
        <span className="badge-circle bronze" title={`${bronze} Bronze Badges (Standard achievements like first posts, profile completeness, or comments)`}>
          <span className="circle-dot">●</span>
          <span className="badge-count">{bronze}</span>
        </span>
      )}
    </span>
  );
};

export default UserBadge;
