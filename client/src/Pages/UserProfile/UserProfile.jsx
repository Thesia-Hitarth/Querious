import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import * as api from "../../api";

import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";
import EditProfileForm from "./EditProfileForm";
import ProfileBio from "./ProfileBio";
import ProfileHeader from "./ProfileHeader";
import BadgesTab from "./BadgesTab";
import SettingsTab from "./SettingsTab";
import ReputationTab from "./ReputationTab";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import EmptyState from "../../components/EmptyState/EmptyState";
import LoadingSkeleton from "../../components/LoadingSkeleton/LoadingSkeleton";
import "./UsersProfile.css";
import { fetchUserDetails } from "../../actions/users";

const UserProfile = ({ slideIn, handleSlideIn }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const users = useSelector((state) => state.usersReducer.data) || [];
  const currentProfile = users.filter((user) => user._id === id)[0];
  const currentUser = useSelector((state) => state.currentUserReducer);
  const userDetails = useSelector((state) => state.userDetailsReducer);

  const [Switch, setSwitch] = useState(false);
  const [activeTab, setActiveTab] = useState("activity");

  // Dedicated user activity state (replaces filtering the global questions store)
  const [userQuestions, setUserQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    if (tab === "saves" && currentUser?.result?._id === id) {
      setActiveTab("saves");
    } else if (tab === "settings" && currentUser?.result?._id === id) {
      setActiveTab("settings");
    } else if (tab === "badges") {
      setActiveTab("badges");
    } else if (tab === "reputation") {
      setActiveTab("reputation");
    } else if (tab === "questions") {
      setActiveTab("questions");
    } else if (tab === "answers") {
      setActiveTab("answers");
    } else {
      setActiveTab("activity");
    }
  }, [location.search, currentUser?.result?._id, id]);

  useEffect(() => {
    dispatch(fetchUserDetails(id));
  }, [id, dispatch]);

  // Fetch user-specific questions and answers from dedicated endpoints
  const fetchUserActivity = useCallback(async () => {
    if (!id) return;
    setActivityLoading(true);
    try {
      const [qRes, aRes] = await Promise.all([
        api.getUserQuestions(id, { limit: 50 }),
        api.getUserAnswers(id, { limit: 50 }),
      ]);
      setUserQuestions(qRes.data.data || []);
      setUserAnswers(aRes.data.data || []);
    } catch (err) {
      console.error("Error fetching user activity:", err);
    } finally {
      setActivityLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserActivity();
  }, [fetchUserActivity]);

  const profileData = userDetails && userDetails._id === id ? userDetails : currentProfile;

  useDocumentMeta({
    title: profileData?.name ? `${profileData.name}'s Profile` : "User Profile",
    description: profileData?.about || `View ${profileData?.name || "user"}'s developer profile on Querious.`,
    keywords: `${profileData?.name || ""}, profile, reputation, badges, developer`,
  });

  const savedQuestionsList = profileData?.savedQuestions || [];

  const normalizedSavedQuestionsList = savedQuestionsList.map((quest) =>
    typeof quest === "string" || typeof quest === "number"
      ? { _id: quest, questionTitle: "Deleted question", userPosted: "Unknown" }
      : quest
  );

  const questionsAsked = profileData?.questionsAsked ?? userQuestions.length;
  const answersGiven = profileData?.answersGiven ?? userAnswers.length;

  return (
    <div className="home-container-1">
      <LeftSidebar slideIn={slideIn} handleSlideIn={handleSlideIn} />
      <div className="home-container-2">
        <section className="profile-section">
          {!profileData ? (
            <LoadingSkeleton type="user-profile" />
          ) : (
            <>
              {/* Profile Header component */}
              <ProfileHeader
                profileData={profileData}
                currentUser={currentUser}
                onEditClick={() => setSwitch(true)}
                questionsAsked={questionsAsked}
                answersGiven={answersGiven}
              />

              {/* Profile right tab content wrapper */}
              <div className="profile-tabs-wrapper" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div className="profile-tabs-header">
                  <button
                    type="button"
                    onClick={() => navigate(`/Users/${id}?tab=activity`)}
                    className={`profile-tab-btn ${activeTab === "activity" ? "active" : ""}`}
                  >
                    Activity
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/Users/${id}?tab=questions`)}
                    className={`profile-tab-btn ${activeTab === "questions" ? "active" : ""}`}
                  >
                    Questions ({userQuestions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/Users/${id}?tab=answers`)}
                    className={`profile-tab-btn ${activeTab === "answers" ? "active" : ""}`}
                  >
                    Answers ({userAnswers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/Users/${id}?tab=badges`)}
                    className={`profile-tab-btn ${activeTab === "badges" ? "active" : ""}`}
                  >
                    Badges
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/Users/${id}?tab=reputation`)}
                    className={`profile-tab-btn ${activeTab === "reputation" ? "active" : ""}`}
                  >
                    Reputation
                  </button>
                  {currentUser?.result?._id === id && (
                    <>
                      <button
                         type="button"
                         onClick={() => navigate(`/Users/${id}?tab=saves`)}
                         className={`profile-tab-btn ${activeTab === "saves" ? "active" : ""}`}
                       >
                         Saved ({savedQuestionsList.length})
                       </button>
                       <button
                         type="button"
                         onClick={() => navigate(`/Users/${id}?tab=settings`)}
                         className={`profile-tab-btn ${activeTab === "settings" ? "active" : ""}`}
                       >
                         Settings
                       </button>
                    </>
                  )}
                </div>

                <div className="profile-tab-content">
                  {activeTab === "activity" && (
                    Switch ? (
                      <EditProfileForm
                        currentUser={currentUser}
                        setSwitch={setSwitch}
                      />
                    ) : (
                      <ProfileBio currentProfile={profileData} />
                    )
                  )}

                  {activeTab === "questions" && (
                    <div className="profile-questions-tab">
                      <h3 className="saved-questions-title">Questions Asked</h3>
                      {activityLoading ? (
                        <p className="tab-empty-text">Loading questions...</p>
                      ) : userQuestions.length === 0 ? (
                        <p className="tab-empty-text">No questions asked yet.</p>
                      ) : (
                        <div className="tab-questions-list">
                          {userQuestions.map((q) => (
                            <div key={q._id} className="profile-list-item card">
                              <Link to={`/Questions/${q._id}`} className="profile-item-title-link">
                                {q.questionTitle}
                              </Link>
                              <span className="profile-item-date">
                                asked {formatDistanceToNow(new Date(q.askedOn), { addSuffix: true })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "answers" && (
                    <div className="profile-answers-tab">
                      <h3 className="saved-questions-title">Answers Contributed</h3>
                      {activityLoading ? (
                        <p className="tab-empty-text">Loading answers...</p>
                      ) : userAnswers.length === 0 ? (
                        <p className="tab-empty-text">No answers given yet.</p>
                      ) : (
                        <div className="tab-answers-list">
                          {userAnswers.map((ans) => {
                            const questionId = ans.questionId?._id || ans.questionId;
                            const questionTitle = ans.questionId?.questionTitle || "Question";
                            return (
                              <div key={ans._id} className="profile-list-item card">
                                <span className="profile-item-label">Answered:</span>
                                <Link to={`/Questions/${questionId}`} className="profile-item-title-link">
                                  {questionTitle}
                                </Link>
                                {ans.isAccepted && (
                                  <span style={{ fontSize: "11px", color: "#2da44e", fontWeight: "600", marginLeft: "6px" }}>✓ Accepted</span>
                                )}
                                <span className="profile-item-date">
                                  replied {ans.answeredOn ? formatDistanceToNow(new Date(ans.answeredOn), { addSuffix: true }) : "recently"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "badges" && (
                    <BadgesTab userId={id} />
                  )}

                  {activeTab === "reputation" && (
                    <ReputationTab userId={id} />
                  )}

                  {activeTab === "saves" && (
                    <div className="saved-questions-container">
                      <h3 className="saved-questions-title">Bookmarked Questions</h3>
                      {normalizedSavedQuestionsList.length === 0 ? (
                        <EmptyState
                          icon={
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                            </svg>
                          }
                          title="No saved questions"
                          description="Bookmark questions to save them here for quick access later."
                          actionLabel="Browse Questions"
                          onAction={() => navigate("/")}
                        />
                      ) : (
                        <div className="saved-questions-list">
                          {normalizedSavedQuestionsList.map((quest) => (
                            <div key={quest._id} className="saved-question-item">
                              <Link to={`/Questions/${quest._id}`} className="saved-question-link">
                                {quest.questionTitle}
                              </Link>
                              <p className="saved-question-meta">
                                Asked by <span className="saved-author">{quest.userPosted || "Anonymous"}</span> • {quest.askedOn ? formatDistanceToNow(new Date(quest.askedOn), { addSuffix: true }) : "Unknown date"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "settings" && (
                    <SettingsTab userId={id} />
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserProfile;
