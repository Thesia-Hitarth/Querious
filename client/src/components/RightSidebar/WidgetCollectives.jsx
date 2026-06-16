import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateProfile } from "../../actions/users";
import "./RightSidebar.css";

const WidgetCollectives = () => {
  const User = useSelector((state) => state.currentUserReducer);
  const dispatch = useDispatch();

  const collectivesList = [
    {
      id: "mern",
      name: "MERN Stack",
      members: "24k Members",
      desc: "A collective for full-stack developers specializing in MongoDB, Express, React, and Node.js...",
      iconClass: "mern"
    },
    {
      id: "php",
      name: "PHP",
      members: "18k Members",
      desc: "A collective where developers working with PHP can learn and connect about the open...",
      iconClass: "php"
    },
    {
      id: "r-lang",
      name: "R Language",
      members: "17k Members",
      desc: "A collective where data scientists and AI researchers gather to find, share, and learn...",
      iconClass: "r-lang"
    },
    {
      id: "nlp",
      name: "NLP",
      members: "13k Members",
      desc: "A collective focused on NLP (natural language processing), the transformation or extraction...",
      iconClass: "nlp"
    }
  ];

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
        {collectivesList.map((c) => {
          const isJoined = User?.result?._id
            ? userCollectives.includes(c.id)
            : joinedCollectives.includes(c.id);
          const isHovered = hoveredCollectiveId === c.id;
          return (
            <div key={c.id} className="collective-item">
              <div className="collective-header">
                <div className="collective-brand">
                  <div className={`collective-icon ${c.iconClass}`}>
                    {c.name.substring(0, 3).toUpperCase()}
                  </div>
                  <div className="collective-info">
                    <span className="collective-name">{c.name}</span>
                    <span className="collective-members">{c.members}</span>
                  </div>
                </div>
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
