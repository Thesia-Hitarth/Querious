import React, { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import "./ContextBar.css";

const ContextBar = () => {
  const location = useLocation();
  const params = useParams();

  // Build breadcrumb segments from route
  const segments = [{ label: "Home", to: "/" }];
  
  if (params.tag) {
    segments.push({ label: `#${params.tag}`, to: `/Tags/${params.tag}` });
  } else if (params.collectiveId) {
    segments.push({ label: params.collectiveId, to: `/Collectives/${params.collectiveId}` });
  } else if (location.pathname.startsWith("/Questions/")) {
    // Check if the next segment is a valid ID (not 'AskQuestion')
    const idParam = location.pathname.split("/")[2];
    if (idParam && idParam !== "AskQuestion") {
      segments.push({ label: "Question", to: null });
    }
  } else if (location.pathname.startsWith("/Users/")) {
    segments.push({ label: "Profile", to: null });
  } else if (location.pathname.startsWith("/Blogs")) {
    segments.push({ label: "Blogs", to: "/Blogs" });
    const blogId = location.pathname.split("/")[2];
    if (blogId) {
      segments.push({ label: `Post #${blogId}`, to: null });
    }
  } else if (location.pathname === "/Tags") {
    segments.push({ label: "Tags", to: null });
  } else if (location.pathname === "/Users") {
    segments.push({ label: "Users", to: null });
  } else if (location.pathname === "/AskQuestion") {
    segments.push({ label: "Ask Question", to: null });
  }

  // Toggle body class to shift main content down when context bar is visible
  useEffect(() => {
    if (segments.length > 1) {
      document.body.classList.add("has-context-bar");
    } else {
      document.body.classList.remove("has-context-bar");
    }
    return () => {
      document.body.classList.remove("has-context-bar");
    };
  }, [segments.length]);

  if (segments.length === 1) return null;

  return (
    <nav className="context-bar" aria-label="Breadcrumb">
      <div className="context-bar-inner">
        {segments.map((seg, i) => (
          <span key={i} className="context-bar-segment">
            {seg.to ? <Link to={seg.to}>{seg.label}</Link> : <span>{seg.label}</span>}
            {i < segments.length - 1 && <span className="context-bar-sep">/</span>}
          </span>
        ))}
      </div>
    </nav>
  );
};

export default ContextBar;
