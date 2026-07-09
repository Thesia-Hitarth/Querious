import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./UserPopover.css";

const UserPopover = ({ user, children }) => {
  const [open, setOpen] = useState(false);
  const [hasHover, setHasHover] = useState(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Disable hover popover on touch devices
    if (window.matchMedia && !window.matchMedia("(hover: hover)").matches) {
      setHasHover(false);
    }
  }, []);

  const show = () => {
    if (!hasHover) return;
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const hide = () => {
    if (!hasHover) return;
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  if (!user || !hasHover) return children;

  return (
    <span className="user-popover-anchor" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            className="user-popover-card"
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            <div className="user-popover-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="user-popover-name">{user.name}</div>
            <div className="user-popover-rep">{user.reputation || 1} reputation</div>
            <Link to={`/Users/${user._id || user.userId}`} className="btn btn-soft user-popover-link">
              View profile
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

export default UserPopover;
