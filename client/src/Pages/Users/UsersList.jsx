import React from "react";
import { useSelector } from "react-redux";

import User from "./User";
import "./Users.css";

const UsersList = ({ searchTerm }) => {
  const users = useSelector((state) => state.usersReducer);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes((searchTerm || "").toLowerCase())
  );

  return (
    <div className="user-list-container">
      {filteredUsers.length > 0 ? (
        filteredUsers.map((user) => (
          <User user={user} key={user?._id} />
        ))
      ) : (
        <p className="users-empty-text">No community members found.</p>
      )}
    </div>
  );
};

export default UsersList;
