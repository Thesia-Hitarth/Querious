import React, { useState } from "react";

import "./Users.css";
import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";
import UsersList from "./UsersList";

const Users = ({ slideIn, handleSlideIn }) => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="home-container-1">
      <LeftSidebar slideIn={slideIn} handleSlideIn={handleSlideIn} />
      <div className="home-container-2" style={{ marginTop: "30px" }}>
        <div className="users-container-inner" style={{ width: "100%" }}>
          <h1 className="users-h1">Community</h1>
          <p className="users-subtitle">Developers helping developers on Querious</p>
          
          <div className="users-search-container">
            <input
              type="text"
              placeholder="Filter by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="users-search-input"
            />
          </div>

          <UsersList searchTerm={searchTerm} />
        </div>
      </div>
    </div>
  );
};

export default Users;
