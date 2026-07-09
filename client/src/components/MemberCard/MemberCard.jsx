import React from "react";
import { Link } from "react-router-dom";
import "./MemberCard.css";

const MemberCard = ({ user }) => {
  const gold = user?.badges?.gold || 0;
  const silver = user?.badges?.silver || 0;
  const bronze = user?.badges?.bronze || 0;
  const hasBadges = gold > 0 || silver > 0 || bronze > 0;

  const isRecentlyActive = user?.updatedAt || user?.joinedOn
    ? (Date.now() - new Date(user.updatedAt || user.joinedOn)) < 7 * 24 * 3600 * 1000
    : false;

  return (
    <div className="card member-card">
      <div className={`avatar-ring ${isRecentlyActive ? "ring-active" : "ring-inactive"}`} style={{ marginBottom: "var(--space-3)" }}>
        <div className="avatar-ring-inner">
          <div className="member-card-avatar" style={{ marginBottom: 0 }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
          </div>
        </div>
      </div>
      
      <div className="member-card-info">
        <Link to={`/Users/${user?._id}`} className="member-card-name">
          {user?.name}
        </Link>
        
        {user?.location && (
          <span className="member-card-location">📍 {user.location}</span>
        )}

        <div className="member-card-stats">
          <span className="member-card-rep" title="Reputation">
            {user?.reputation || 1} rep
          </span>
          {hasBadges && (
            <div className="member-card-badge-shelf">
              {gold > 0 && <span className="mini-badge-dot gold" title={`${gold} Gold`}>● {gold}</span>}
              {silver > 0 && <span className="mini-badge-dot silver" title={`${silver} Silver`}>● {silver}</span>}
              {bronze > 0 && <span className="mini-badge-dot bronze" title={`${bronze} Bronze`}>● {bronze}</span>}
            </div>
          )}
        </div>

        {user?.about ? (
          <p className="member-card-bio" title={user.about}>
            {user.about.length > 60 ? user.about.substring(0, 60) + "..." : user.about}
          </p>
        ) : (
          <p className="member-card-bio empty">No bio written yet.</p>
        )}
      </div>
    </div>
  );
};

export default React.memo(MemberCard);
