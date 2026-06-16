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

const EmptyStateSVG = () => (
  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-brand-primary)", marginBottom: "var(--space-4)", opacity: 0.6 }}>
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M8 12h8"></path>
    <path d="M12 8v8"></path>
  </svg>
);

const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

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
  const usersList = useSelector((state) => state.usersReducer) || [];
  const [activeTab, setActiveTab] = useState("newest");
  const [isLoading, setIsLoading] = useState(false);

  // Filter Drawer State Variables
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterNoAnswers, setFilterNoAnswers] = useState(false);
  const [filterNoAccepted, setFilterNoAccepted] = useState(false);
  const [filterDaysOld, setFilterDaysOld] = useState("");
  const [filterSort, setFilterSort] = useState("newest");
  const [filterTagsOption, setFilterTagsOption] = useState("any");
  const [filterTags, setFilterTags] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});

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

  const handleApplyFilter = (e) => {
    e.preventDefault();
    const filters = {
      filterNoAnswers: filterNoAnswers ? "true" : "false",
      filterNoAccepted: filterNoAccepted ? "true" : "false",
      filterDaysOld: filterDaysOld ? parseInt(filterDaysOld) : "",
      filterTags: filterTagsOption === "custom" ? filterTags.trim() : "",
      filterSort,
    };
    setAppliedFilters(filters);
    setIsFilterOpen(false);
  };

  const handleResetFilter = () => {
    setFilterNoAnswers(false);
    setFilterNoAccepted(false);
    setFilterDaysOld("");
    setFilterSort("newest");
    setFilterTagsOption("any");
    setFilterTags("");
    setAppliedFilters({});
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
                <span className="hero-stat-number">{questionsList.data?.length || 0}+</span>
                <span className="hero-stat-label">Questions</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">
                  {questionsList.data?.reduce((acc, q) => acc + (q.answer?.length || 0), 0) || 0}+
                </span>
                <span className="hero-stat-label">Answers</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">{usersList.length || 0}+</span>
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
          {questionsList.data ? `${questionsList.data.length} questions` : "Loading…"}
        </span>

        <div className="questions-filter-pills-row">
          <div className="questions-tabs">
            {["newest", "active", "unanswered"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => handleTabClick(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
            <form onSubmit={handleApplyFilter} className="filter-form">
              <div className="filter-grid">
                {/* Column 1: Filter By */}
                <div className="filter-col">
                  <h4>Filter by</h4>
                  <div className="filter-group">
                    <label className="filter-checkbox-label">
                      <input
                        type="checkbox"
                        checked={filterNoAnswers}
                        onChange={(e) => setFilterNoAnswers(e.target.checked)}
                      />
                      <span>No answers</span>
                    </label>
                    <label className="filter-checkbox-label">
                      <input
                        type="checkbox"
                        checked={filterNoAccepted}
                        onChange={(e) => setFilterNoAccepted(e.target.checked)}
                      />
                      <span>No accepted answers</span>
                    </label>
                    <div className="filter-input-row">
                      <input
                        type="number"
                        placeholder="e.g. 30"
                        value={filterDaysOld}
                        onChange={(e) => setFilterDaysOld(e.target.value)}
                        min="1"
                        className="filter-number-input"
                      />
                      <span>Days old</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Sorted By */}
                <div className="filter-col">
                  <h4>Sorted by</h4>
                  <div className="filter-group">
                    <label className="filter-radio-label">
                      <input
                        type="radio"
                        name="filterSort"
                        value="newest"
                        checked={filterSort === "newest"}
                        onChange={() => setFilterSort("newest")}
                      />
                      <span>Newest</span>
                    </label>
                    <label className="filter-radio-label">
                      <input
                        type="radio"
                        name="filterSort"
                        value="activity"
                        checked={filterSort === "activity"}
                        onChange={() => setFilterSort("activity")}
                      />
                      <span>Recent activity</span>
                    </label>
                    <label className="filter-radio-label">
                      <input
                        type="radio"
                        name="filterSort"
                        value="score"
                        checked={filterSort === "score"}
                        onChange={() => setFilterSort("score")}
                      />
                      <span>Highest score</span>
                    </label>
                    <label className="filter-radio-label">
                      <input
                        type="radio"
                        name="filterSort"
                        value="views"
                        checked={filterSort === "views"}
                        onChange={() => setFilterSort("views")}
                      />
                      <span>Most frequent</span>
                    </label>
                  </div>
                </div>

                {/* Column 3: Tagged With */}
                <div className="filter-col">
                  <h4>Tagged with</h4>
                  <div className="filter-group">
                    <label className="filter-radio-label">
                      <input
                        type="radio"
                        name="filterTagsOption"
                        value="any"
                        checked={filterTagsOption === "any"}
                        onChange={() => setFilterTagsOption("any")}
                      />
                      <span>Any tags</span>
                    </label>
                    <label className="filter-radio-label">
                      <input
                        type="radio"
                        name="filterTagsOption"
                        value="custom"
                        checked={filterTagsOption === "custom"}
                        onChange={() => setFilterTagsOption("custom")}
                      />
                      <span>The following tags:</span>
                    </label>
                    {filterTagsOption === "custom" && (
                      <input
                        type="text"
                        placeholder="e.g. reactjs nodejs"
                        value={filterTags}
                        className="filter-tags-input"
                        onChange={(e) => setFilterTags(e.target.value)}
                        autoFocus
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="filter-footer">
                <button type="submit" className="btn filter-apply-btn">
                  Apply filter
                </button>
                <button type="button" onClick={handleResetFilter} className="filter-cancel-btn">
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
              <div className="empty-state-container">
                <EmptyStateSVG />
                <h2>No questions found</h2>
                <p>
                  Be the first to ask something!
                  <button type="button" className="empty-state-ask-link" onClick={checkAuth}>
                    Ask a question
                  </button>
                </p>
              </div>
            ) : (
              <>
                <p className="questions-count-text" style={{ padding: "12px 20px", borderBottom: "1px solid var(--color-border-light)", margin: 0 }}>
                  {questionsList.data.length} questions found
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
