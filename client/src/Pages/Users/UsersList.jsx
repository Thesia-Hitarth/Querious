import React from "react";
import { useSelector } from "react-redux";
import MemberCard from "../../components/MemberCard/MemberCard";
import "./Users.css";

const UsersList = ({ searchTerm, sortMode }) => {
  const users = useSelector((state) => state.usersReducer);

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes((searchTerm || "").toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortMode === "reputation") {
      return (b.reputation || 1) - (a.reputation || 1);
    }
    if (sortMode === "newest") {
      return new Date(b.joinedOn || 0) - new Date(a.joinedOn || 0);
    }
    if (sortMode === "alpha") {
      return (a.name || "").localeCompare(b.name || "");
    }
    return 0;
  });

  return (
    <div className="user-list-container">
      {sortedUsers.length > 0 ? (
        sortedUsers.map((user) => (
          <MemberCard user={user} key={user?._id} />
        ))
      ) : (
        <p className="users-empty-text">No community members found.</p>
      )}
    </div>
  );
};

export default React.memo(UsersList);
