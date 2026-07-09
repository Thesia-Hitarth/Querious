import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { updateProfile } from "../../actions/users";
import { COLLECTIVES } from "../../constants/collectives";
import CollectiveIcon from "../../components/CollectiveIcon/CollectiveIcon";
import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";
import RightSidebar from "../../components/RightSidebar/RightSidebar";
import HomeMainbar from "../../components/HomeMainbar/HomeMainbar";
import "./CollectiveDetail.css";

const CollectiveDetail = ({ slideIn, handleSlideIn }) => {
  const { collectiveId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const User = useSelector((state) => state.currentUserReducer);
  const userCollectives = User?.result?.collectives || [];

  const collective = COLLECTIVES.find((c) => c.id === collectiveId);

  const [joinedCollectives, setJoinedCollectives] = useState(() => {
    try {
      const saved = localStorage.getItem("joined_collectives");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (collectiveId && !collective) {
      navigate("/");
    }
  }, [collectiveId, collective, navigate]);

  if (!collective) return null;

  const isJoined = User?.result?._id
    ? userCollectives.includes(collective.id)
    : joinedCollectives.includes(collective.id);

  const handleToggleJoin = async () => {
    if (User?.result?._id) {
      const updated = isJoined
        ? userCollectives.filter((id) => id !== collective.id)
        : [...userCollectives, collective.id];
      
      try {
        await dispatch(updateProfile(User.result._id, { collectives: updated }));
      } catch (err) {
        console.error("Failed to update collectives on server", err);
      }
    } else {
      const updated = isJoined
        ? joinedCollectives.filter((id) => id !== collective.id)
        : [...joinedCollectives, collective.id];
      setJoinedCollectives(updated);
      localStorage.setItem("joined_collectives", JSON.stringify(updated));
    }
  };

  return (
    <div className="home-container-1">
      <LeftSidebar slideIn={slideIn} handleSlideIn={handleSlideIn} />
      <div className="home-container-2">
        <div className="collective-detail-wrapper">
          <div className="collective-banner">
            <div className="collective-banner-left">
              <CollectiveIcon name={collective.name} iconClass={collective.iconClass} size={64} />
              <div className="collective-banner-info">
                <h1>{collective.name}</h1>
                <p>{collective.desc}</p>
                <span className="collective-banner-members">{collective.members}</span>
              </div>
            </div>
            <button
              type="button"
              className={`btn collective-banner-btn ${isJoined ? "btn-ghost joined" : "btn-primary"}`}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={handleToggleJoin}
            >
              {isJoined ? (isHovered ? "Leave" : "✓ Joined") : "Join Collective"}
            </button>
          </div>
          <div className="collective-questions-feed">
            <HomeMainbar tag={collective.tags[0]} />
          </div>
        </div>
        <RightSidebar />
      </div>
    </div>
  );
};

export default CollectiveDetail;
