import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";
import Avatar from "../../components/Avatar/Avatar";
import EditProfileForm from "./EditProfileForm";
import ProfileBio from "./ProfileBio";
import "./UsersProfile.css";
import { fetchUserDetails } from "../../actions/users";

// Inline SVGs replacing FontAwesome
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

const UserProfile = ({ slideIn, handleSlideIn }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const users = useSelector((state) => state.usersReducer);
  const currentProfile = users.filter((user) => user._id === id)[0];
  const currentUser = useSelector((state) => state.currentUserReducer);
  const userDetails = useSelector((state) => state.userDetailsReducer);
  const questionsList = useSelector((state) => state.questionsReducer.data) || [];

  const [Switch, setSwitch] = useState(false);
  const [activeTab, setActiveTab] = useState("bio");

  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    if (tab === "saves" && currentUser?.result?._id === id) {
      setActiveTab("saves");
    } else {
      setActiveTab("bio");
    }
  }, [location.search, currentUser?.result?._id, id]);

  useEffect(() => {
    dispatch(fetchUserDetails(id));
  }, [id, dispatch]);

  const profileData = userDetails && userDetails._id === id ? userDetails : currentProfile;
  const savedQuestionsList = profileData?.savedQuestions || [];

  // Compute user statistics
  const questionsAsked = questionsList.filter((q) => q.userId === id).length;
  const answersGiven = questionsList.reduce((acc, q) => {
    const userAnswers = q.answer?.filter((ans) => ans.userId === id) || [];
    return acc + userAnswers.length;
  }, 0);

  return (
    <div className="home-container-1">
      <LeftSidebar slideIn={slideIn} handleSlideIn={handleSlideIn} />
      <div className="home-container-2">
        <section className="profile-section">
          {/* Profile Header Card */}
          <div className="profile-header-card">
            <div className="profile-avatar-wrapper">
              <Avatar
                backgroundColor="var(--color-brand-primary)"
                color="white"
                fontSize="40px"
                px="32px"
                py="24px"
              >
                {profileData?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </div>
            
            <div className="profile-header-info">
              <h1 className="profile-name">{profileData?.name}</h1>
              <div className="profile-meta-row">
                {profileData?.joinedOn && (
                  <span className="profile-meta-item">
                    <BirthdayCakeIcon /> Joined {formatDistanceToNow(new Date(profileData.joinedOn), { addSuffix: true })}
                  </span>
                )}
                {profileData?.location && (
                  <span className="profile-meta-item">
                    📍 {profileData.location}
                  </span>
                )}
                {profileData?.website && (
                  <span className="profile-meta-item">
                    🔗 <a href={profileData.website} target="_blank" rel="noreferrer">{profileData.website}</a>
                  </span>
                )}
              </div>
            </div>

            {currentUser?.result._id === id && (
              <button
                type="button"
                onClick={() => setSwitch(true)}
                className="edit-profile-btn"
              >
                <PenIcon /> Edit Profile
              </button>
            )}
          </div>

          {/* Two columns layout */}
          <div className="profile-content-grid">
            {/* Left Column: Stats & Tags */}
            <div className="profile-left-column">
              <h3 className="profile-sec-title">Stats</h3>
              <div className="profile-stats-grid">
                <div className="stat-tile">
                  <span className="stat-num">{questionsAsked}</span>
                  <span className="stat-lbl">Questions</span>
                </div>
                <div className="stat-tile">
                  <span className="stat-num">{answersGiven}</span>
                  <span className="stat-lbl">Answers</span>
                </div>
                <div className="stat-tile">
                  <span className="stat-num">{profileData?.reputation || 1}</span>
                  <span className="stat-lbl">Reputation</span>
                </div>
              </div>

              {profileData?.tags && profileData.tags.length > 0 && (
                <div className="profile-tags-widget">
                  <h3 className="profile-sec-title">Interests</h3>
                  <div className="profile-tags-list">
                    {profileData.tags.map((tag) => (
                      <Link to={`/Tags/${tag}`} key={tag} className="tag-chip">
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {(() => {
                const gold = profileData?.badges?.gold || 0;
                const silver = profileData?.badges?.silver || 0;
                const bronze = profileData?.badges?.bronze || 0;

                if (gold === 0 && silver === 0 && bronze === 0) return null;

                return (
                  <div className="profile-badges-widget" style={{ marginTop: "20px" }}>
                    <h3 className="profile-sec-title">Badges</h3>
                    <div className="profile-badges-list">
                      {gold > 0 && (
                        <div className="badge-tile gold-tile">
                          <span className="badge-dot gold-dot">●</span>
                          <span className="badge-count">{gold}</span>
                          <span className="badge-label">Gold</span>
                        </div>
                      )}
                      {silver > 0 && (
                        <div className="badge-tile silver-tile">
                          <span className="badge-dot silver-dot">●</span>
                          <span className="badge-count">{silver}</span>
                          <span className="badge-label">Silver</span>
                        </div>
                      )}
                      {bronze > 0 && (
                        <div className="badge-tile bronze-tile">
                          <span className="badge-dot bronze-dot">●</span>
                          <span className="badge-count">{bronze}</span>
                          <span className="badge-label">Bronze</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right Column: Bio or Saves */}
            <div className="profile-right-column">
              <div className="profile-tabs-header">
                <button
                  type="button"
                  onClick={() => navigate(`/Users/${id}`)}
                  className={`profile-tab-btn ${activeTab === "bio" ? "active" : ""}`}
                >
                  Bio
                </button>
                {currentUser?.result?._id === id && (
                  <button
                    type="button"
                    onClick={() => navigate(`/Users/${id}?tab=saves`)}
                    className={`profile-tab-btn ${activeTab === "saves" ? "active" : ""}`}
                  >
                    Saved Questions ({savedQuestionsList.length})
                  </button>
                )}
              </div>

              <div className="profile-tab-content">
                {activeTab === "bio" ? (
                  Switch ? (
                    <EditProfileForm
                      currentUser={currentUser}
                      setSwitch={setSwitch}
                    />
                  ) : (
                    <ProfileBio currentProfile={profileData} />
                  )
                ) : (
                  <div className="saved-questions-container">
                    <h3 className="saved-questions-title">Bookmarked Questions</h3>
                    {savedQuestionsList.length === 0 ? (
                      <p className="saved-questions-empty">No bookmarked questions yet.</p>
                    ) : (
                      <div className="saved-questions-list">
                        {savedQuestionsList.map((quest) => (
                          <div key={quest._id} className="saved-question-item">
                            <Link to={`/Questions/${quest._id}`} className="saved-question-link">
                              {quest.questionTitle}
                            </Link>
                            <p className="saved-question-meta">
                              Asked by <span className="saved-author">{quest.userPosted || "Anonymous"}</span> • {quest.askedOn && formatDistanceToNow(new Date(quest.askedOn), { addSuffix: true })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default UserProfile;
