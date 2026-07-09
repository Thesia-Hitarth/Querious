import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../../api";
import "./WidgetLeaderboard.css";

const WidgetLeaderboard = () => {
  const [topUsers, setTopUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.getAllUsers()
      .then(({ data }) => {
        const sorted = [...data].sort((a, b) => (b.reputation || 0) - (a.reputation || 0)).slice(0, 5);
        setTopUsers(sorted);
      })
      .catch((err) => {
        console.error("Failed to load leaderboard users:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="card widget-leaderboard">
        <div className="widget-header">
          <span className="section-label">Top Contributors</span>
        </div>
        <div className="leaderboard-loading">Loading contributors...</div>
      </div>
    );
  }

  if (topUsers.length === 0) {
    return null;
  }

  return (
    <div className="card widget-leaderboard">
      <div className="widget-header">
        <span className="section-label">Top Contributors</span>
      </div>
      <ol className="leaderboard-list">
        {topUsers.map((u, i) => (
          <li key={u._id} className="leaderboard-row">
            <span className={`leaderboard-rank rank-${i + 1}`}>{i + 1}</span>
            <div className="leaderboard-avatar">
              {u.name ? u.name.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="leaderboard-user-details">
              <Link to={`/Users/${u._id}`} className="leaderboard-name">{u.name}</Link>
              <span className="leaderboard-rep">{u.reputation || 1} rep</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default WidgetLeaderboard;
