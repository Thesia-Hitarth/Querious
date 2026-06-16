import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBirthdayCake, faPen } from "@fortawesome/free-solid-svg-icons";
import { formatDistanceToNow } from "date-fns";

import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";
import Avatar from "../../components/Avatar/Avatar";
import EditProfileForm from "./EditProfileForm";
import ProfileBio from "./ProfileBio";
import "./UsersProfile.css";
import { fetchUserDetails } from "../../actions/users";

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
    if (tab === "saves") {
      setActiveTab("saves");
    } else {
      setActiveTab("bio");
    }
  }, [location.search]);

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
                    <FontAwesomeIcon icon={faBirthdayCake} /> Joined {formatDistanceToNow(new Date(profileData.joinedOn), { addSuffix: true })}
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
                <FontAwesomeIcon icon={faPen} /> Edit Profile
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
                    <div className="profile-badges-list" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {gold > 0 && (
                        <div className="badge-tile gold-tile" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", border: "1px solid #f1e5bc", backgroundColor: "#fdf7e2", borderRadius: "4px" }}>
                          <span style={{ color: "#ffcc00", fontSize: "16px" }}>●</span>
                          <span style={{ fontWeight: "600", fontSize: "14px" }}>{gold}</span>
                          <span style={{ color: "#6a737c", fontSize: "12px" }}>Gold</span>
                        </div>
                      )}
                      {silver > 0 && (
                        <div className="badge-tile silver-tile" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", border: "1px solid #d6d9dc", backgroundColor: "#f1f2f3", borderRadius: "4px" }}>
                          <span style={{ color: "#b4b8bc", fontSize: "16px" }}>●</span>
                          <span style={{ fontWeight: "600", fontSize: "14px" }}>{silver}</span>
                          <span style={{ color: "#6a737c", fontSize: "12px" }}>Silver</span>
                        </div>
                      )}
                      {bronze > 0 && (
                        <div className="badge-tile bronze-tile" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", border: "1px solid #e1ecf4", backgroundColor: "#f9fbfd", borderRadius: "4px" }}>
                          <span style={{ color: "#d1a684", fontSize: "16px" }}>●</span>
                          <span style={{ fontWeight: "600", fontSize: "14px" }}>{bronze}</span>
                          <span style={{ color: "#6a737c", fontSize: "12px" }}>Bronze</span>
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
                <button
                  type="button"
                  onClick={() => navigate(`/Users/${id}?tab=saves`)}
                  className={`profile-tab-btn ${activeTab === "saves" ? "active" : ""}`}
                >
                  Saved Questions ({savedQuestionsList.length})
                </button>
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
