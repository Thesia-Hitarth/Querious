import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { updateProfile } from "../../actions/users";
import { COLLECTIVES } from "../../constants/collectives";
import CollectiveIcon from "../CollectiveIcon/CollectiveIcon";
import "./RightSidebar.css";

const WidgetCollectives = () => {
  const User = useSelector((state) => state.currentUserReducer);
  const dispatch = useDispatch();

  const [joinedCollectives, setJoinedCollectives] = useState(() => {
    try {
      const saved = localStorage.getItem("joined_collectives");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [hoveredCollectiveId, setHoveredCollectiveId] = useState(null);

  const userCollectives = User?.result?.collectives || [];

  const handleToggleJoinCollective = async (cId) => {
    if (User?.result?._id) {
      const isJoined = userCollectives.includes(cId);
      const updated = isJoined
        ? userCollectives.filter((id) => id !== cId)
        : [...userCollectives, cId];
      
      try {
        await dispatch(updateProfile(User.result._id, { collectives: updated }));
      } catch (err) {
        console.error("Failed to update collectives on server", err);
      }
    } else {
      const updated = joinedCollectives.includes(cId)
        ? joinedCollectives.filter((id) => id !== cId)
        : [...joinedCollectives, cId];
      setJoinedCollectives(updated);
      localStorage.setItem("joined_collectives", JSON.stringify(updated));
    }
  };

  return (
    <div className="widget-card collectives-widget" style={{ marginTop: "15px" }}>
      <div className="collectives-header-row">
        <h3 className="collectives-sec-title">Collectives</h3>
        <a href="/Tags" className="see-all-link">see all</a>
      </div>
      <div className="collectives-list">
        {COLLECTIVES.map((c) => {
          const isJoined = User?.result?._id
            ? userCollectives.includes(c.id)
            : joinedCollectives.includes(c.id);
          const isHovered = hoveredCollectiveId === c.id;
          return (
            <div key={c.id} className="collective-item">
              <div className="collective-header">
                <Link to={`/Collectives/${c.id}`} className="collective-brand">
                  <CollectiveIcon name={c.name} iconClass={c.iconClass} size={32} />
                  <div className="collective-info">
                    <span className="collective-name">{c.name}</span>
                    <span className="collective-members">{c.members}</span>
                  </div>
                </Link>
                <button
                  type="button"
                  className={`collective-btn ${isJoined ? "joined" : ""}`}
                  onMouseEnter={() => setHoveredCollectiveId(c.id)}
                  onMouseLeave={() => setHoveredCollectiveId(null)}
                  onClick={() => handleToggleJoinCollective(c.id)}
                >
                  {isJoined ? (isHovered ? "Leave" : "✓ Joined") : "Join"}
                </button>
              </div>
              <p className="collective-desc">{c.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WidgetCollectives;
