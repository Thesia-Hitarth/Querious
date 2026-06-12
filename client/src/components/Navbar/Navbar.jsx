import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { jwtDecode as decode } from "jwt-decode";
import { formatDistanceToNow } from "date-fns";

import logo from "../../assets/Only-Symbol.png";
import "./Navbar.css";
import { setCurrentUser } from "../../actions/currentUser";
import { fetchAllQuestions } from "../../actions/question";
import { markAsRead, markAllAsRead } from "../../actions/notifications";

// Custom Inline SVG Icons
const MenuIconSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const SearchIconSVG = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const BellIconSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const UserIconSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const Navbar = ({ handleSlideIn }) => {
  const dispatch = useDispatch();
  const User = useSelector((state) => state.currentUserReducer);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const debounceTimeout = useRef(null);

  const notificationsList = useSelector((state) => state.notificationsReducer) || { data: [] };
  const notifications = notificationsList.data || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [isBellOpen, setIsBellOpen] = useState(false);
  const bellRef = useRef(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      const tagMatch = value.match(/\[([^\]]+)\]/);
      const parsedTag = tagMatch ? tagMatch[1].trim() : "";
      const searchVal = tagMatch ? value.replace(/\[[^\]]+\]/g, "").trim() : value;
      dispatch({ type: "SET_SEARCH_QUERY", payload: value });
      dispatch(fetchAllQuestions({ search: searchVal, tag: parsedTag }));
    }, 300);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    dispatch({ type: "SET_SEARCH_QUERY", payload: "" });
    dispatch(fetchAllQuestions({ search: "", tag: "" }));
  };

  const handleLogout = useCallback(() => {
    dispatch({ type: "LOGOUT" });
    navigate("/");
    dispatch(setCurrentUser(null));
  }, [dispatch, navigate]);

  const handleNotificationClick = (notif) => {
    dispatch(markAsRead(notif._id));
    setIsBellOpen(false);
    navigate(`/Questions/${notif.questionId}`);
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  const searchInputRef = useRef(null);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === "/" &&
        document.activeElement !== searchInputRef.current &&
        document.activeElement.tagName !== "INPUT" &&
        document.activeElement.tagName !== "TEXTAREA" &&
        !document.activeElement.isContentEditable
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    let prevScrollPos = window.pageYOffset || document.documentElement.scrollTop;

    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset || document.documentElement.scrollTop;
      // Show navbar if scrolling up or if close to the top (within 80px)
      const isVisible = prevScrollPos > currentScrollPos || currentScrollPos < 80;

      if (isVisible) {
        document.documentElement.classList.remove("navbar-hidden");
      } else {
        document.documentElement.classList.add("navbar-hidden");
      }

      prevScrollPos = currentScrollPos;
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.documentElement.classList.remove("navbar-hidden");
    };
  }, []);

  useEffect(() => {
    const token = User?.token;
    if (token) {
      try {
        const decodedToken = decode(token);
        if (decodedToken.exp * 1000 < new Date().getTime()) handleLogout();
      } catch (e) {
        console.error("Failed to decode token, logging out:", e);
        handleLogout();
      }
    }
    dispatch(setCurrentUser(JSON.parse(localStorage.getItem("Profile"))));
  }, [User?.token, dispatch, handleLogout]);

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
        {/* Mobile hamburger */}
        <button className="slide-in-icon" onClick={() => handleSlideIn()} aria-label="Open menu">
          <MenuIconSVG />
        </button>

        {/* Logo */}
        <div className="navbar-left">
          <Link to="/" className="nav-item nav-logo">
            <img src={logo} alt="Querious" className="nav-logo-img" />
            <span>
              <span className="nav-logo-text-accent">Q</span>
              <span className="nav-logo-text">uerious</span>
            </span>
          </Link>
        </div>

        {/* Search */}
        <div className="navbar-center">
          <form
            className={`navbar-search-form ${isSearchExpanded ? "mobile-expanded" : ""}`}
            onSubmit={(e) => e.preventDefault()}
          >
            <span className="search-icon">
              <SearchIconSVG />
            </span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search questions… (Press '/' to focus)"
              value={searchQuery}
              onChange={handleSearchChange}
              aria-label="Search questions"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
            <span className="keyboard-shortcut-hint">/</span>
          </form>
        </div>

        {/* Right side */}
        <div className="navbar-right">
          {/* Mobile search toggle */}
          <button
            type="button"
            className="mobile-search-toggle"
            onClick={() => setIsSearchExpanded(!isSearchExpanded)}
            aria-label="Toggle search"
          >
            <SearchIconSVG />
          </button>

          {User === null ? (
            <>
              <Link to="/Auth" className="btn login-btn">
                <span className="login-text-desktop">Log in</span>
                <span className="login-icon-mobile"><UserIconSVG /></span>
              </Link>
              <Link to="/Auth" className="btn signup-btn">
                Sign up
              </Link>
            </>
          ) : (
            <>
              {/* Bell */}
              <div className="navbar-bell-container" ref={bellRef}>
                <button
                  type="button"
                  className="navbar-bell-btn"
                  onClick={() => setIsBellOpen(!isBellOpen)}
                  aria-label="Notifications"
                >
                  <BellIconSVG />
                  {unreadCount > 0 && <span className="navbar-bell-badge" />}
                </button>

                {isBellOpen && (
                  <div className="notifications-dropdown">
                    <div className="bell-dropdown-header">
                      <h4>Notifications {unreadCount > 0 && <span style={{ color: "var(--color-brand-primary)", fontSize: "13px" }}>({unreadCount})</span>}</h4>
                      {unreadCount > 0 && (
                        <button type="button" className="mark-all-read-btn" onClick={handleMarkAllRead}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="no-notifications">🔔 No notifications yet</p>
                    ) : (
                      <div className="notifications-list">
                        {notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`notification-item ${notif.read ? "read" : "unread"}`}
                            onClick={() => handleNotificationClick(notif)}
                          >
                            <span className="notif-message">{notif.message}</span>
                            <span className="notif-time">
                              {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Avatar */}
              <div className="navbar-avatar">
                <Link to={`/Users/${User?.result?._id}`} aria-label="View profile">
                  {User.result.name.charAt(0).toUpperCase()}
                </Link>
              </div>

              <button className="btn logout-btn" onClick={handleLogout}>
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
