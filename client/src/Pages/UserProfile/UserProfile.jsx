import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";
import EditProfileForm from "./EditProfileForm";
import ProfileBio from "./ProfileBio";
import ProfileHeader from "./ProfileHeader";
import EmptyState from "../../components/EmptyState/EmptyState";
import LoadingSkeleton from "../../components/LoadingSkeleton/LoadingSkeleton";
import "./UsersProfile.css";
import { fetchUserDetails } from "../../actions/users";

const UserProfile = ({ slideIn, handleSlideIn }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const users = useSelector((state) => state.usersReducer);
  const currentProfile = users.filter((user) => user._id === id)[0];
  const currentUser = useSelector((state) => state.currentUserReducer);
  const userDetails = useSelector((state) => state.userDetailsReducer);
  const questionsList = useSelector((state) => state.questionsReducer.data) || [];

  const [Switch, setSwitch] = useState(false);
  const [activeTab, setActiveTab] = useState("activity");

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    if (tab === "saves" && currentUser?.result?._id === id) {
      setActiveTab("saves");
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

  const profileData = userDetails && userDetails._id === id ? userDetails : currentProfile;
  const savedQuestionsList = profileData?.savedQuestions || [];

  const normalizedSavedQuestionsList = savedQuestionsList.map((quest) =>
    typeof quest === "string" || typeof quest === "number"
      ? { _id: quest, questionTitle: "Deleted question", userPosted: "Unknown" }
      : quest
  );

  const questionsAsked = profileData?.questionsAsked ?? questionsList.filter((q) => String(q.userId) === String(id)).length;
  const answersGiven = profileData?.answersGiven ?? questionsList.reduce((acc, q) => {
    const userAnswers = q.answer?.filter((ans) => String(ans.userId) === String(id)) || [];
    return acc + userAnswers.length;
  }, 0);

  const userQuestions = questionsList.filter((q) => String(q.userId) === String(id));
  const userAnswers = questionsList.filter((q) => q.answer?.some((ans) => String(ans.userId) === String(id)));

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
                  {currentUser?.result?._id === id && (
                    <button
                      type="button"
                      onClick={() => navigate(`/Users/${id}?tab=saves`)}
                      className={`profile-tab-btn ${activeTab === "saves" ? "active" : ""}`}
                    >
                      Saved ({savedQuestionsList.length})
                    </button>
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
                      {userQuestions.length === 0 ? (
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
                      {userAnswers.length === 0 ? (
                        <p className="tab-empty-text">No answers given yet.</p>
                      ) : (
                        <div className="tab-answers-list">
                          {userAnswers.map((q) => {
                            const ansObj = q.answer?.find((a) => String(a.userId) === String(id));
                            return (
                              <div key={q._id} className="profile-list-item card">
                                <span className="profile-item-label">Answered:</span>
                                <Link to={`/Questions/${q._id}`} className="profile-item-title-link">
                                  {q.questionTitle}
                                </Link>
                                <span className="profile-item-date">
                                  replied {ansObj?.answeredOn ? formatDistanceToNow(new Date(ansObj.answeredOn), { addSuffix: true }) : "recently"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
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
