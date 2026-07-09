import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import "./HomeMainbar.css";
import QuestionList from "./QuestionList";
import LoadingSkeleton from "../../components/LoadingSkeleton/LoadingSkeleton";
import Pagination from "../Pagination/Pagination";
import { fetchAllQuestions } from "../../actions/question";
import { useToast } from "../Toast/ToastContext";
import useQuestionFilters from "../../hooks/useQuestionFilters";
import FilterFields from "./FilterFields";

import EmptyState from "../../components/EmptyState/EmptyState";

const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const CountUp = ({ end, duration = 800 }) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let startTimestamp = null;
    let frameId;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * end));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(step);
      }
    };
    frameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frameId);
  }, [end, duration]);

  return <>{count}</>;
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

const HomeMainbar = ({ tag }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.currentUserReducer);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const questionsList = useSelector((state) => state.questionsReducer);
  const searchQuery = questionsList.searchQuery;
  const [activeTab, setActiveTab] = useState("newest");
  const [isLoading, setIsLoading] = useState(false);

  // Filter Drawer Open State
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filterProps = useQuestionFilters();
  const {
    appliedFilters,
    handleApplyFilter,
    handleResetFilter,
    handleCancel
  } = filterProps;

  useEffect(() => {
    const queryParams = {
      page: 1,
      tab: activeTab,
      tag,
      ...appliedFilters
    };
    const loadQuestions = async () => {
      setIsLoading(true);
      try {
        if (tag) {
          await dispatch(fetchAllQuestions(queryParams));
        } else if (location.pathname === "/" || location.pathname === "/Questions") {
          await dispatch(fetchAllQuestions(queryParams));
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadQuestions();
  }, [location.pathname, tag, activeTab, dispatch, appliedFilters]);

  const checkAuth = () => {
    if (user === null) {
      showToast("Please login or signup to ask a question", "warning");
      navigate("/Auth");
    } else {
      navigate("/AskQuestion");
    }
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  const handlePageChange = async (pageNumber) => {
    setIsLoading(true);
    try {
      await dispatch(fetchAllQuestions({ page: pageNumber, tab: activeTab, tag, ...appliedFilters }));
    } catch (err) {
      console.error("Error fetching questions on page change:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Wrapped forms handlers to close drawer on action
  const onDrawerApply = (e) => {
    handleApplyFilter(e);
    setIsFilterOpen(false);
  };

  const onDrawerReset = () => {
    handleResetFilter();
    setIsFilterOpen(false);
  };

  const onDrawerCancel = () => {
    handleCancel();
    setIsFilterOpen(false);
  };

  return (
    <motion.div
      className="main-bar"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section for logged-out users */}
      <AnimatePresence>
        {location.pathname === "/" && user === null && (
          <motion.div
            className="hero-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <motion.div
              className="hero-eyebrow"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <SparkleIcon />
              Developer Community
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              Ask. Answer.{" "}
              <span className="hero-highlight">Grow.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.4 }}
            >
              The modern platform where developers collaborate, share knowledge, and build together.
            </motion.p>

            <motion.div
              className="hero-buttons"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.35 }}
            >
              <Link to="/Auth" className="btn hero-btn-started">
                Get Started — Free
              </Link>
              <button
                type="button"
                onClick={() => {
                  const element = document.getElementById("questions-feed-anchor");
                  element?.scrollIntoView({ behavior: "smooth" });
                }}
                className="btn hero-btn-browse"
              >
                Browse Questions
              </button>
            </motion.div>

            <motion.div
              className="hero-stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            >
              <div className="hero-stat">
                <span className="hero-stat-number"><CountUp end={questionsList.totalSiteQuestions || 0} />+</span>
                <span className="hero-stat-label">Questions</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number"><CountUp end={questionsList.totalSiteAnswers || 0} />+</span>
                <span className="hero-stat-label">Answers</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number"><CountUp end={questionsList.totalSiteUsers || 0} />+</span>
                <span className="hero-stat-label">Users</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll anchor */}
      <div id="questions-feed-anchor" />

      {/* Header Row */}
      <motion.div className="main-bar-header" variants={itemVariants}>
        {searchQuery ? (
          <h1>Results for: &ldquo;{searchQuery}&rdquo;</h1>
        ) : tag ? (
          <h1>Questions tagged [{tag}]</h1>
        ) : location.pathname === "/" ? (
          <h1>Top Questions</h1>
        ) : (
          <h1>All Questions</h1>
        )}
        <button onClick={checkAuth} className="btn ask-btn">
          Ask Question
        </button>
      </motion.div>

      {/* Tabs Row */}
      <motion.div className="questions-tabs-container" variants={itemVariants}>
        <span className="questions-count">
          {questionsList.data ? `${questionsList.totalCount || 0} questions` : "Loading…"}
        </span>

        <div className="questions-filter-pills-row">
          <div className="questions-tabs">
            {["newest", "active", "unanswered", "hot"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => handleTabClick(tab)}
              >
                {tab === "hot" ? "🔥 Trending" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`filter-btn ${isFilterOpen || Object.keys(appliedFilters).length > 0 ? "active" : ""}`}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="filter-icon">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            <span>Filter</span>
          </button>
        </div>
      </motion.div>

      {/* Filter Drawer Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            className="filter-drawer-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <form onSubmit={onDrawerApply} className="filter-form">
              <FilterFields
                {...filterProps}
                onImmediate={false}
              />

              <div className="filter-footer">
                <button type="submit" className="btn filter-apply-btn">
                  Apply filter
                </button>
                <button type="button" onClick={onDrawerReset} className="filter-reset-btn" style={{ marginLeft: "auto" }}>
                  Reset Filters
                </button>
                <button type="button" onClick={onDrawerCancel} className="filter-cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Questions Feed */}
      <motion.div className="questions-feed-wrapper" variants={itemVariants}>
        {isLoading || !questionsList.data ? (
          <LoadingSkeleton type="question-list" count={4} />
        ) : (
          <>
            {questionsList.data.length === 0 ? (
              <EmptyState
                icon={
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                  </svg>
                }
                title={searchQuery ? "No search results found" : "No questions found"}
                description={searchQuery ? `We couldn't find any questions matching "${searchQuery}". Try adjusting your keywords or filters.` : "Be the first to ask a question and start a conversation in our community!"}
                actionLabel="Ask a Question"
                onAction={checkAuth}
              />
            ) : (
              <>
                <p className="questions-count-text" style={{ padding: "12px 20px", borderBottom: "1px solid var(--color-border-light)", margin: 0 }}>
                  {questionsList.totalCount || 0} questions found
                </p>
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
      </motion.div>
    </motion.div>
  );
};

export default HomeMainbar;
