import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import "./HomeMainbar.css";
import QuestionList from "./QuestionList";
import LoadingSkeleton from "../../components/LoadingSkeleton/LoadingSkeleton";
import Pagination from "../Pagination/Pagination";
import { fetchAllQuestions } from "../../actions/question";

// SVG Empty State Illustration
const EmptyStateSVG = () => (
  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-brand-primary)", marginBottom: "var(--space-4)" }}>
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M8 12h8"></path>
    <path d="M12 8v8"></path>
  </svg>
);

const HomeMainbar = ({ tag }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.currentUserReducer);
  const navigate = useNavigate();

  const questionsList = useSelector((state) => state.questionsReducer);
  const searchQuery = questionsList.searchQuery;
  const [activeTab, setActiveTab] = useState("newest");

  useEffect(() => {
    if (tag) {
      dispatch(fetchAllQuestions({ page: 1, tab: activeTab, tag }));
    } else if (location.pathname === "/" || location.pathname === "/Questions") {
      dispatch(fetchAllQuestions({ page: 1, tab: activeTab }));
    }
  }, [location.pathname, tag, activeTab, dispatch]);

  const checkAuth = () => {
    if (user === null) {
      alert("Login or Signup to ask a question");
      navigate("/Auth");
    } else {
      navigate("/AskQuestion");
    }
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    dispatch(fetchAllQuestions({ page: 1, tab: tabName, tag }));
  };

  const handlePageChange = (pageNumber) => {
    dispatch(fetchAllQuestions({ page: pageNumber, tab: activeTab, tag }));
  };

  return (
    <div className="main-bar">
      {/* SaaS Hero Section for logged-out users on Home page (Section 3) */}
      {location.pathname === "/" && user === null && (
        <div className="hero-section">
          <h1>Ask. Answer. Grow.</h1>
          <p>The modern community for developers.</p>
          <div className="hero-buttons">
            <Link to="/Auth" className="btn btn-primary hero-btn-started">
              Get Started — Free
            </Link>
            <button
              type="button"
              onClick={() => {
                const element = document.getElementById("questions-feed-anchor");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
              className="btn btn-ghost hero-btn-browse"
            >
              Browse Questions
            </button>
          </div>
        </div>
      )}

      {/* Anchor scroll point below Hero */}
      <div id="questions-feed-anchor" />

      {/* Header Row */}
      <div className="main-bar-header">
        {searchQuery ? (
          <h1>Results for: "{searchQuery}"</h1>
        ) : tag ? (
          <h1>Questions tagged [{tag}]</h1>
        ) : location.pathname === "/" ? (
          <h1>Top Questions</h1>
        ) : (
          <h1>All Questions</h1>
        )}
        <button onClick={checkAuth} className="btn btn-primary ask-btn">
          Ask Question
        </button>
      </div>

      {/* Sorting Tabs Section (Section 4) */}
      <div className="questions-tabs-container">
        <span className="questions-count">
          {questionsList.data ? `${questionsList.data.length} questions` : "0 questions"}
        </span>
        
        <div className="questions-filter-pills-row">
          <div className="questions-tabs">
            <button
              type="button"
              className={`tab-btn ${activeTab === "newest" ? "active" : ""}`}
              onClick={() => handleTabClick("newest")}
            >
              Newest
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "active" ? "active" : ""}`}
              onClick={() => handleTabClick("active")}
            >
              Active
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "unanswered" ? "active" : ""}`}
              onClick={() => handleTabClick("unanswered")}
            >
              Unanswered
            </button>
          </div>

          <button type="button" className="filter-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="filter-icon">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Questions list area */}
      <div className="questions-feed-wrapper">
        {questionsList.data === null ? (
          <LoadingSkeleton type="question-list" count={4} />
        ) : (
          <>
            {questionsList.data.length === 0 ? (
              /* Empty State view (Section 7) */
              <div className="empty-state-container">
                <EmptyStateSVG />
                <h2>No questions found</h2>
                <p>
                  Be the first to ask something!{" "}
                  <button type="button" className="empty-state-ask-link" onClick={checkAuth}>
                    Ask a question
                  </button>
                </p>
              </div>
            ) : (
              <>
                <p className="questions-count-text">{questionsList.data.length} questions</p>
                <div className="questions-list-container">
                  <QuestionList questionsList={questionsList.data} />
                </div>
                <Pagination
                  totalPages={questionsList.totalPages}
                  currentPage={questionsList.currentPage}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomeMainbar;
