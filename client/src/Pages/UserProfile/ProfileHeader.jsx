import React from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import "./ProfileHeader.css";

const BirthdayCakeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px", display: "inline-block", verticalAlign: "middle" }}>
    <path d="M12 2v4M6 8v3M18 8v3" />
    <path d="M3 12h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8z" />
    <path d="M3 16h18" />
  </svg>
);

const PenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px", display: "inline-block", verticalAlign: "middle" }}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);

const ProfileHeader = ({
  profileData,
  currentUser,
  onEditClick,
  questionsAsked = 0,
  answersGiven = 0,
}) => {
  const gold = profileData?.badges?.gold || 0;
  const silver = profileData?.badges?.silver || 0;
  const bronze = profileData?.badges?.bronze || 0;
  const hasBadges = gold > 0 || silver > 0 || bronze > 0;

  return (
    <div className="profile-header-container card">
      {/* Cover band using redesigned cover gradient token */}
      <div className="profile-cover-band"></div>

      <div className="profile-header-meta-section">
        {/* Avatar overlapping cover band */}
        <div className="profile-avatar-large">
          {profileData?.name ? profileData.name.charAt(0).toUpperCase() : "?"}
        </div>

        {/* Info panel */}
        <div className="profile-header-details">
          <div className="profile-header-title-row">
            <h1 className="profile-display-name">{profileData?.name}</h1>
            {currentUser?.result?._id === profileData?._id && (
              <button
                type="button"
                className="btn btn-ghost edit-profile-action-btn"
                onClick={onEditClick}
              >
                <PenIcon /> Edit Profile
              </button>
            )}
          </div>

          <div className="profile-meta-chips">
            {profileData?.joinedOn && (
              <span className="profile-meta-chip">
                <BirthdayCakeIcon /> Joined {formatDistanceToNow(new Date(profileData.joinedOn), { addSuffix: true })}
              </span>
            )}
            {profileData?.location && (
              <span className="profile-meta-chip">📍 {profileData.location}</span>
            )}
            {profileData?.website && (
              <span className="profile-meta-chip">
                🔗 <a href={profileData.website} target="_blank" rel="noreferrer">{profileData.website}</a>
              </span>
            )}
          </div>

          {profileData?.about && (
            <p className="profile-header-about">{profileData.about}</p>
          )}

          {/* GroupOS-style 4-column Stats Row */}
          <div className="profile-stats-dashboard">
            <div className="profile-stat-item">
              <span className="profile-stat-val">{profileData?.reputation || 1}</span>
              <span className="profile-stat-lbl">Reputation</span>
            </div>
            <div className="profile-stat-item">
              <span className="profile-stat-val">{questionsAsked}</span>
              <span className="profile-stat-lbl">Questions</span>
            </div>
            <div className="profile-stat-item">
              <span className="profile-stat-val">{answersGiven}</span>
              <span className="profile-stat-lbl">Answers</span>
            </div>
            <div className="profile-stat-item badges-stat">
              <div className="badge-totals">
                <span className="badge-count-sum">{gold + silver + bronze}</span>
                <span className="profile-stat-lbl">Badges</span>
              </div>
            </div>
          </div>

          {/* Badges Shelf & Interests */}
          <div className="profile-footer-widgets">
            {hasBadges && (
              <div className="profile-badge-shelf">
                <h4 className="section-label">Badges Earned</h4>
                <div className="badge-shelf-pills">
                  {gold > 0 && (
                    <span className="badge-shelf-pill gold" title={`${gold} Gold badges`}>
                      <span className="badge-bullet">●</span> Gold {gold}
                    </span>
                  )}
                  {silver > 0 && (
                    <span className="badge-shelf-pill silver" title={`${silver} Silver badges`}>
                      <span className="badge-bullet">●</span> Silver {silver}
                    </span>
                  )}
                  {bronze > 0 && (
                    <span className="badge-shelf-pill bronze" title={`${bronze} Bronze badges`}>
                      <span className="badge-bullet">●</span> Bronze {bronze}
                    </span>
                  )}
                </div>
              </div>
            )}

            {profileData?.tags && profileData.tags.length > 0 && (
              <div className="profile-interests-widget">
                <h4 className="section-label">Interests</h4>
                <div className="profile-interests-chips">
                  {profileData.tags.map((tag) => (
                    <Link to={`/Tags/${tag}`} key={tag} className="tag-chip">
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProfileHeader);
