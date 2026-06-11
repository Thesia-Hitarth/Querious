import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router";
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
  
  const users = useSelector((state) => state.usersReducer);
  const currentProfile = users.filter((user) => user._id === id)[0];
  const currentUser = useSelector((state) => state.currentUserReducer);
  const userDetails = useSelector((state) => state.userDetailsReducer);

  const [Switch, setSwitch] = useState(false);
  const [activeTab, setActiveTab] = useState("bio");

  useEffect(() => {
    dispatch(fetchUserDetails(id));
  }, [id, dispatch]);

  const profileData = userDetails && userDetails._id === id ? userDetails : currentProfile;
  const savedQuestionsList = profileData?.savedQuestions || [];

  return (
    <div className="home-container-1">
      <LeftSidebar slideIn={slideIn} handleSlideIn={handleSlideIn} />
      <div className="home-container-2">
        <section>
          <div className="user-details-container">
            <div className="user-details">
              <Avatar
                backgroundColor="purple"
                color="white"
                fontSize="50px"
                px="40px"
                py="30px"
              >
                {profileData?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <div className="user-name">
                <h1>{profileData?.name}</h1>
                <p style={{ margin: "5px 0", fontSize: "14px", color: "#f48024", fontWeight: "bold" }}>
                  Reputation: {profileData?.reputation || 1}
                </p>
                <p>
                  <FontAwesomeIcon icon={faBirthdayCake} /> Joined{" "}
                  {profileData?.joinedOn && formatDistanceToNow(new Date(profileData.joinedOn), { addSuffix: true })}
                </p>
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

          <div className="user-profile-tabs" style={{ display: "flex", gap: "15px", borderBottom: "1px solid #ccc", marginBottom: "20px", marginTop: "20px" }}>
            <button
              onClick={() => setActiveTab("bio")}
              style={{
                background: "none",
                border: "none",
                borderBottom: activeTab === "bio" ? "3px solid #f48024" : "3px solid transparent",
                padding: "10px",
                cursor: "pointer",
                fontWeight: activeTab === "bio" ? "bold" : "normal",
                color: activeTab === "bio" ? "#222" : "#666"
              }}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("saves")}
              style={{
                background: "none",
                border: "none",
                borderBottom: activeTab === "saves" ? "3px solid #f48024" : "3px solid transparent",
                padding: "10px",
                cursor: "pointer",
                fontWeight: activeTab === "saves" ? "bold" : "normal",
                color: activeTab === "saves" ? "#222" : "#666"
              }}
            >
              Saved Questions ({savedQuestionsList.length})
            </button>
          </div>

          <>
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
              <div className="saved-questions-container" style={{ padding: "10px 0" }}>
                <h3 style={{ fontWeight: "400", borderBottom: "1px solid #edeff0", paddingBottom: "10px" }}>Bookmarked Questions</h3>
                {savedQuestionsList.length === 0 ? (
                  <p style={{ color: "#666" }}>No bookmarked questions yet.</p>
                ) : (
                  <div className="saved-questions-list">
                    {savedQuestionsList.map((quest) => (
                      <div key={quest._id} style={{ padding: "12px 0", borderBottom: "1px solid #edeff0" }}>
                        <Link to={`/Questions/${quest._id}`} style={{ textDecoration: "none", color: "#0074cc", fontSize: "16px", fontWeight: "bold" }}>
                          {quest.questionTitle}
                        </Link>
                        <p style={{ fontSize: "13px", color: "#6a737c", margin: "5px 0 0 0" }}>
                          Asked by {quest.userPosted || "Anonymous"} • {quest.askedOn && formatDistanceToNow(new Date(quest.askedOn), { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        </section>
      </div>
    </div>
  );
};

export default UserProfile;
