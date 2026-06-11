import React from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import UserBadge from "../../components/UserBadge/UserBadge";
import "./Users.css";

const User = ({ user }) => {
  return (
    <Link to={`/Users/${user._id}`} className="user-profile-link">
      <div className="user-card-avatar">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <h5 className="user-card-name">{user.name}</h5>
      <div className="user-card-reputation">
        <UserBadge userId={user._id} />
      </div>
      {user.joinedOn && (
        <span className="user-card-joined">
          Joined {formatDistanceToNow(new Date(user.joinedOn), { addSuffix: true })}
        </span>
      )}
    </Link>
  );
};

export default User;
