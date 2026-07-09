import React, { useEffect } from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import "./LeftSidebar.css";

// SVG Icons
const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const QuestionsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const TagsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
    <line x1="7" y1="7" x2="7.01" y2="7"></line>
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const SavedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
);

const ProfileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const BlogIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);

// Animation variants
const sidebarVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
};

const LeftSidebar = ({ slideIn, handleSlideIn }) => {
  const User = useSelector((state) => state.currentUserReducer);
  const usersList = useSelector((state) => state.usersReducer.data) || [];
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.innerWidth <= 760 && slideIn && handleSlideIn) {
      handleSlideIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleLinkClick = () => {
    if (window.innerWidth <= 760 && handleSlideIn) {
      handleSlideIn();
    }
  };

  const searchParams = new URLSearchParams(location.search);
  const isSavesTab = searchParams.get("tab") === "saves";
  const isSelfProfile =
    User?.result?._id && location.pathname === `/Users/${User?.result?._id}`;

  const loggedInUserDetails = usersList.find((u) => u._id === User?.result?._id);
  const rep = loggedInUserDetails?.reputation || User?.result?.reputation || 1;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {slideIn && (
          <motion.div
            className="left-sidebar-overlay"
            onClick={handleLinkClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      <div className={`left-sidebar ${slideIn ? "slide-in" : ""}`}>
        <motion.nav
          className="side-nav"
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
        >
          {/* DISCOVER */}
          <div className="side-nav-section">
            <span className="side-nav-label">Discover</span>

            <motion.div variants={itemVariants}>
              <NavLink to="/" className="side-nav-links" onClick={handleLinkClick} end>
                <HomeIcon />
                <span>Home</span>
              </NavLink>
            </motion.div>

            <motion.div variants={itemVariants}>
              <NavLink to="/Questions" className="side-nav-links" onClick={handleLinkClick}>
                <QuestionsIcon />
                <span>Questions</span>
              </NavLink>
            </motion.div>

            <motion.div variants={itemVariants}>
              <NavLink to="/Tags" className="side-nav-links" onClick={handleLinkClick}>
                <TagsIcon />
                <span>Tags</span>
              </NavLink>
            </motion.div>

            <motion.div variants={itemVariants}>
              <NavLink to="/Blogs" className="side-nav-links" onClick={handleLinkClick}>
                <BlogIcon />
                <span>Blogs</span>
              </NavLink>
            </motion.div>
          </div>

          {/* COMMUNITY */}
          <div className="side-nav-section">
            <span className="side-nav-label">Community</span>

            <motion.div variants={itemVariants}>
              <NavLink to="/Users" className="side-nav-links" onClick={handleLinkClick} end>
                <UsersIcon />
                <span>Users</span>
              </NavLink>
            </motion.div>
          </div>

          {/* MY ACTIVITY */}
          {User && (
            <div className="side-nav-section">
              <span className="side-nav-label">My Activity</span>

              <motion.div variants={itemVariants}>
                <NavLink
                  to={`/Users/${User?.result?._id}?tab=saves`}
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `side-nav-links ${
                      isSavesTab && location.pathname.startsWith(`/Users/${User?.result?._id}`)
                        ? "active"
                        : ""
                    }`
                  }
                >
                  <SavedIcon />
                  <span>Saved</span>
                </NavLink>
              </motion.div>

              <motion.div variants={itemVariants}>
                <NavLink
                  to={`/Users/${User?.result?._id}`}
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `side-nav-links ${!isSavesTab && isSelfProfile ? "active" : ""}`
                  }
                >
                  <ProfileIcon />
                  <span>Profile</span>
                </NavLink>
              </motion.div>
            </div>
          )}
        </motion.nav>

        {/* Sticky Profile reputation strip */}
        {User && (
          <div className="sidebar-reputation-strip">
            <div className="sidebar-rep-avatar">
              {User.result.name.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-rep-info">
              <span className="sidebar-rep-name">{User.result.name}</span>
              <span className="sidebar-rep-score">{rep} reputation</span>
            </div>
            <Link to={`/Users/${User.result._id}`} className="sidebar-rep-link">→</Link>
          </div>
        )}
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="mobile-bottom-tabbar">
        <NavLink to="/" className="mobile-tab-item" end>
          <HomeIcon />
          <span>Home</span>
        </NavLink>
        <NavLink to="/Questions" className="mobile-tab-item">
          <QuestionsIcon />
          <span>Questions</span>
        </NavLink>
        <button
          type="button"
          className="mobile-tab-item raised-ask-btn"
          onClick={() => {
            if (User === null) {
              navigate("/Auth");
            } else {
              navigate("/AskQuestion");
            }
          }}
          aria-label="Ask Question"
        >
          <span className="plus-icon">+</span>
        </button>
        <NavLink to={User ? `/Users/${User.result._id}?tab=saves` : "/Auth"} className="mobile-tab-item">
          <SavedIcon />
          <span>Saved</span>
        </NavLink>
        <NavLink to={User ? `/Users/${User.result._id}` : "/Auth"} className="mobile-tab-item">
          <ProfileIcon />
          <span>Profile</span>
        </NavLink>
      </nav>
    </>
  );
};

export default LeftSidebar;
