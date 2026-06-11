import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import "./HomeMainbar.css";
import QuestionList from "./QuestionList";
import LoadingSkeleton from "../../components/LoadingSkeleton/LoadingSkeleton";
import Pagination from "../Pagination/Pagination";
import { fetchAllQuestions } from "../../actions/question";

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
      alert("login or signup to ask a question");
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
        <button onClick={checkAuth} className="ask-btn">
          Ask Question
        </button>
      </div>
      <div className="questions-tabs-container">
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
      </div>
      <div>
        {questionsList.data === null ? (
          <LoadingSkeleton type="question-list" count={4} />
        ) : (
          <>
            <p>{questionsList.data.length} questions</p>
            <QuestionList questionsList={questionsList.data} />
            <Pagination
              totalPages={questionsList.totalPages}
              currentPage={questionsList.currentPage}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default HomeMainbar;
