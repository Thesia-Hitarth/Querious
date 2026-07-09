import React, { useState } from "react";
import "./Users.css";
import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";
import UsersList from "./UsersList";

const Users = ({ slideIn, handleSlideIn }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState("reputation");

  return (
    <div className="home-container-1">
      <LeftSidebar slideIn={slideIn} handleSlideIn={handleSlideIn} />
      <div className="home-container-2" style={{ marginTop: "30px" }}>
        <div className="users-container-inner" style={{ width: "100%" }}>
          <h1 className="users-h1">Community</h1>
          <p className="users-subtitle">Developers helping developers on Querious</p>
          
          <div className="users-search-container" style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-5)" }}>
            <input
              type="text"
              placeholder="Filter by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="users-search-input"
              style={{ flex: 1, minWidth: "200px", maxWidth: "400px" }}
            />
            
            <div className="users-sort-tabs" style={{ display: "flex", gap: "var(--space-2)" }}>
              <button
                type="button"
                className={`tab-btn ${sortMode === "reputation" ? "active" : ""}`}
                onClick={() => setSortMode("reputation")}
              >
                Reputation
              </button>
              <button
                type="button"
                className={`tab-btn ${sortMode === "newest" ? "active" : ""}`}
                onClick={() => setSortMode("newest")}
              >
                Newest
              </button>
              <button
                type="button"
                className={`tab-btn ${sortMode === "alpha" ? "active" : ""}`}
                onClick={() => setSortMode("alpha")}
              >
                Alphabetical
              </button>
            </div>
          </div>

          <UsersList searchTerm={searchTerm} sortMode={sortMode} />
        </div>
      </div>
    </div>
  );
};

export default Users;
