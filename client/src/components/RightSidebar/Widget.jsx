import React from "react";
import { Link } from "react-router-dom";
import { BLOG_POSTS } from "../../constants/blogPosts";
import "./RightSidebar.css";

// SVG Icons
const PenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="widget-item-icon">
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);

const MessageIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="widget-item-icon">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const LogoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="widget-item-icon">
    <path d="M18.986 21.867v-5.633h-10.922v5.633h10.922zm-10.922-7.51h10.922l-2.072-4.523H10.136l-2.072 4.523zm3.109-7.904l7.813 3.652 1.472-3.151-7.813-3.652-1.472 3.151zm5.188-4.577l5.342 6.702 2.502-1.992-5.342-6.702-2.502 1.992zM2.5 10v11.867h3.633V10H2.5z"></path>
  </svg>
);

const Widget = () => {
  const blogPosts = BLOG_POSTS.filter((post) => post.category === "blog");
  const insightsPosts = BLOG_POSTS.filter((post) => post.category === "insights");
  const trendingPosts = BLOG_POSTS.filter((post) => post.category === "trending");

  const renderIcon = (iconName) => {
    switch (iconName) {
      case "pen":
        return <PenIcon />;
      case "message":
        return <MessageIcon />;
      case "logo":
        return <LogoIcon />;
      default:
        return null;
    }
  };

  return (
    <div className="widget-card yellow-widget">
      <div className="widget-section">
        <h4 className="widget-title">The Querious Blog</h4>
        <ul className="widget-list">
          {blogPosts.map((post, idx) => (
            <li key={idx} className="widget-item">
              {renderIcon(post.icon)}
              <Link to={`/Blogs/${post.blogId}`}>
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="widget-section">
        <h4 className="widget-title">System Engineering Insights</h4>
        <ul className="widget-list">
          {insightsPosts.map((post, idx) => (
            <li key={idx} className="widget-item">
              {renderIcon(post.icon)}
              <Link to={`/Blogs/${post.blogId}`}>
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="widget-section">
        <h4 className="widget-title">Trending Tech Discussions</h4>
        <ul className="widget-list">
          {trendingPosts.map((post, idx) => (
            <li key={idx} className="widget-item">
              <span className="meta-post-count">{post.count}</span>
              <Link to={`/Blogs/${post.blogId}`}>
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Widget;
