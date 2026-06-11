import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { jwtDecode as decode } from "jwt-decode";
import { formatDistanceToNow } from "date-fns";

import logo from "../../assets/logo.png";
import search from "../../assets/search-solid.svg";
import Avatar from "../../components/Avatar/Avatar";
import "./Navbar.css";
import { setCurrentUser } from "../../actions/currentUser";
import { fetchAllQuestions } from "../../actions/question";
import { markAsRead, markAllAsRead } from "../../actions/notifications";
import bars from "../../assets/bars-solid.svg";

const Navbar = ({ handleSlideIn }) => {
  const dispatch = useDispatch();
  const User = useSelector((state) => state.currentUserReducer);
  const navigate = useNavigate();

  // Search state & debounce
  const [searchQuery, setSearchQuery] = useState("");
  const debounceTimeout = useRef(null);

  // Notifications state
  const notificationsList = useSelector((state) => state.notificationsReducer) || { data: [] };
  const notifications = notificationsList.data || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [isBellOpen, setIsBellOpen] = useState(false);
  const bellRef = useRef(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      dispatch({ type: "SET_SEARCH_QUERY", payload: value });
      dispatch(fetchAllQuestions({ search: value }));
    }, 300);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    dispatch({ type: "SET_SEARCH_QUERY", payload: "" });
    dispatch(fetchAllQuestions({ search: "" }));
  };

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/");
    dispatch(setCurrentUser(null));
  };

  const handleNotificationClick = (notif) => {
    dispatch(markAsRead(notif._id));
    setIsBellOpen(false);
    navigate(`/Questions/${notif.questionId}`);
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  useEffect(() => {
    const token = User?.token;
    if (token) {
      try {
        const decodedToken = decode(token);
        if (decodedToken.exp * 1000 < new Date().getTime()) {
          handleLogout();
        }
      } catch (e) {
        console.error("Failed to decode token, logging out:", e);
        handleLogout();
      }
    }
    dispatch(setCurrentUser(JSON.parse(localStorage.getItem("Profile"))));
  }, [User?.token, dispatch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="main-nav">
      <div className="navbar">
        <button className="slide-in-icon" onClick={() => handleSlideIn()}>
          <img src={bars} alt="bars" width="15" />
        </button>
        <div className="navbar-1">
          <Link to="/" className="nav-item nav-logo">
            <img src={logo} alt="logo" />
          </Link>
          <Link to="/" className="nav-item nav-btn res-nav">
            About
          </Link>
          <Link to="/" className="nav-item nav-btn res-nav">
            Products
          </Link>
          <Link to="/" className="nav-item nav-btn res-nav">
            For Teams
          </Link>
          <form className="navbar-search-form" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearSearch}
              >
                &times;
              </button>
            )}
            <img src={search} alt="search" width="18" className="search-icon" />
          </form>
        </div>
        <div className="navbar-2">
          {User === null ? (
            <Link to="/Auth" className="nav-item nav-links">
              Log in
            </Link>
          ) : (
            <>
              {/* Notification Bell */}
              <div className="navbar-bell-container" ref={bellRef}>
                <button
                  type="button"
                  className="navbar-bell-btn"
                  onClick={() => setIsBellOpen(!isBellOpen)}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="navbar-bell-badge">{unreadCount}</span>
                  )}
                </button>
                {isBellOpen && (
                  <div className="navbar-bell-dropdown">
                    <div className="bell-dropdown-header">
                      <h4>Notifications</h4>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          className="mark-all-read-btn"
                          onClick={handleMarkAllRead}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="no-notifications">No new notifications</p>
                    ) : (
                      <div className="notifications-list">
                        {notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`notification-item ${
                              notif.read ? "read" : "unread"
                            }`}
                            onClick={() => handleNotificationClick(notif)}
                          >
                            <span className="notif-message">{notif.message}</span>
                            <span className="notif-time">
                              {formatDistanceToNow(new Date(notif.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Avatar
                backgroundColor="#009dff"
                px="10px"
                py="7px"
                borderRadius="50%"
                color="white"
              >
                <Link
                  to={`/Users/${User?.result?._id}`}
                  style={{ color: "white", textDecoration: "none" }}
                >
                  {User.result.name.charAt(0).toUpperCase()}
                </Link>
              </Avatar>
              <button className="nav-item nav-links" onClick={handleLogout}>
                Log out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
