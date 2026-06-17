import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";
import { useToast } from "../../components/Toast/ToastContext";
import "./Blogs.css";

export const blogsData = [
  {
    id: 1,
    title: "Mastering State Management in React 18: Redux Toolkit vs. Context API",
    summary: "Learn how to choose the right state management tool for your MERN stack application, optimizing render performance and developer ergonomics.",
    author: "Querious Dev Team",
    date: "June 11, 2026",
    readTime: "5 min read",
    tags: ["reactjs", "javascript", "mern"],
    content: `State management is one of the most critical decisions when building a MERN stack application. While the React Context API is excellent for sharing global data (like themes or authentication states), it is not optimized for high-frequency state updates. Every time a Context value changes, all consumers of that Context re-render, which can lead to performance bottlenecks.

Redux Toolkit (RTK), on the other hand, utilizes selectors to ensure components only re-render when the specific slice of state they subscribe to changes. RTK also simplifies Redux setup by eliminating boilerplate code, providing built-in support for asynchronous thunks, and integrating seamlessly with Redux DevTools.

For production MERN apps, use React Context for simple, static data, and Redux Toolkit for complex, dynamic application states.`
  },
  {
    id: 2,
    title: "Building Secure REST APIs in Node.js & Express: JWT best practices",
    summary: "A comprehensive walkthrough of token-based authentication, cookies vs headers, token refresh flows, and secure password hashing with bcrypt.",
    author: "Security Architect",
    date: "June 10, 2026",
    readTime: "8 min read",
    tags: ["node.js", "express", "mongodb"],
    content: `Security should never be an afterthought in MERN applications. JSON Web Tokens (JWT) are the industry standard for stateless authentication, but storing them insecurely can expose your users to XSS (Cross-Site Scripting) and CSRF (Cross-Site Request Forgery) attacks.

The most secure approach is storing access tokens in application memory (state) and refresh tokens in HttpOnly, Secure, SameSite cookies. This prevents malicious scripts from accessing tokens directly. Additionally, ensure all passwords are hashed using bcrypt with an appropriate salt round (e.g., 10 or 12) before saving them to MongoDB.

Always configure cors middleware to whitelist only your frontend domain, and use helmet to secure HTTP headers.`
  },
  {
    id: 3,
    title: "Advanced MongoDB Schema Design: Embedding vs. Referencing documents",
    summary: "Structure your MongoDB collections for optimal query performance, scaling, and memory efficiency in production.",
    author: "Database Engineer",
    date: "June 08, 2026",
    readTime: "6 min read",
    tags: ["mongodb", "database", "mern"],
    content: `In MongoDB, document modeling is key to performance. Unlike relational databases, MongoDB supports nesting documents within other documents (embedding) as well as linking them using ObjectIds (referencing).

Embedding is ideal for one-to-many relationships where the child data is consistently requested with the parent data and the nested array size is bounded (e.g. comments on a post). This avoids costly database joins and retrieves all data in a single read operation.

Referencing is preferred when the child documents are unbounded in size or shared across multiple parent documents (e.g., users and orders). This prevents hitting the 16MB document size limit and maintains data integrity without duplicate writes.`
  }
];

const Blogs = ({ slideIn, handleSlideIn }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const hasId = Boolean(id);

  // If a specific ID is requested, show that post, otherwise show the list
  const blogPost = hasId ? blogsData.find((b) => b.id === parseInt(id)) : null;

  useEffect(() => {
    if (hasId && !blogPost) {
      showToast("Blog post not found", "error");
      navigate("/Blogs");
    }
  }, [hasId, blogPost, navigate, showToast]);

  if (hasId && !blogPost) {
    return null;
  }

  return (
    <div className="home-container-1">
      <LeftSidebar slideIn={slideIn} handleSlideIn={handleSlideIn} />
      <div className="home-container-2">
        <div className="blogs-container-inner" style={{ width: "100%" }}>
          {hasId ? (
            blogPost ? (
              <div className="blog-post-details">
                <Link to="/Blogs" className="back-blogs-link">
                  ← Back to Blogs
                </Link>
                <h1 className="blog-post-title">{blogPost.title}</h1>
                <div className="blog-post-meta">
                  <span>By <strong>{blogPost.author}</strong></span>
                  <span>·</span>
                  <span>{blogPost.date}</span>
                  <span>·</span>
                  <span>{blogPost.readTime}</span>
                </div>
                <div className="blog-post-tags">
                  {blogPost.tags.map((tag) => (
                    <span key={tag} className="tag-chip">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="blog-post-content">
                  {blogPost.content.split("\n\n").map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="blog-not-found">
                <Link to="/Blogs" className="back-blogs-link">
                  ← Back to Blogs
                </Link>
                <h2>Article not found</h2>
                <p>The blog article you are looking for does not exist or has been removed.</p>
              </div>
            )
          ) : (
            <div className="blogs-list-page">
              <h1 className="blogs-heading">The Querious Blog</h1>
              <p className="blogs-subtitle">
                Technical insights, tutorials, and best practices for MERN Stack developers.
              </p>
              
              <div className="blogs-grid">
                {blogsData.map((blog) => (
                  <div key={blog.id} className="blog-card">
                    <h2 className="blog-card-title">
                      <Link to={`/Blogs/${blog.id}`}>{blog.title}</Link>
                    </h2>
                    <div className="blog-card-meta">
                      <span>{blog.date}</span>
                      <span>·</span>
                      <span>{blog.readTime}</span>
                    </div>
                    <p className="blog-card-summary">{blog.summary}</p>
                    <Link to={`/Blogs/${blog.id}`} className="blog-read-more">
                      Read Article →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Blogs;
