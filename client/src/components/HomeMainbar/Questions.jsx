import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useSelector, useDispatch } from "react-redux";
import { toggleSaveQuestion } from "../../actions/users";
import UserBadge from "../UserBadge/UserBadge";
import "../../Pages/Questions/Questions.css";
import { useToast } from "../Toast/ToastContext";

// SVG Bookmark Icon
const BookmarkIconSVG = ({ filled }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "var(--color-warning)" : "none"} stroke={filled ? "var(--color-warning)" : "currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
);

// Helper to strip HTML tags from Rich Text editor content for body snippets
const stripHtml = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
};

const Questions = ({ question }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const User = useSelector((state) => state.currentUserReducer);
  const { showToast } = useToast();

  const handleBookmarkClick = (e, questionId) => {
    e.preventDefault();
    e.stopPropagation();
    if (User === null) {
      showToast("Please login or signup to bookmark a question", "warning");
      navigate("/Auth");
    } else {
      dispatch(toggleSaveQuestion(User.result._id, questionId));
    }
  };

  const cleanBody = stripHtml(question.questionBody);
  const bodySnippet = cleanBody.length > 120 
    ? cleanBody.substring(0, 120) + "..." 
    : cleanBody;

  const score = (question.upVote?.length || 0) - (question.downVote?.length || 0);
  const isBookmarked = User?.result?.savedQuestions?.includes(question._id);

  return (
    <div className="question-card display-question-container">
      {/* Left stats column (90px wide stacked layout) */}
      <div className="question-stats-col">
        <div className="question-stat-pill" title={`${score} votes`}>
          <span className="stat-number">{score}</span>
          <span className="stat-label">votes</span>
        </div>
        
        <div 
          className={`question-stat-pill ${
            question.acceptedAnswerId ? "accepted" : question.noOfAnswers > 0 ? "has-answers" : ""
          }`}
          title={`${question.noOfAnswers || 0} answers`}
        >
          <span className="stat-number">{question.noOfAnswers || 0}</span>
          <span className="stat-label">answers</span>
        </div>
        
        <div className="question-stat-pill" title={`${question.views || 0} views`}>
          <span className="stat-number">{question.views || 0}</span>
          <span className="stat-label">views</span>
        </div>
      </div>

      {/* Right details content column */}
      <div className="display-question-details">
        <div className="question-title-row">
          <button
            type="button"
            className="bookmark-btn"
            onClick={(e) => handleBookmarkClick(e, question._id)}
            title={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
          >
            <BookmarkIconSVG filled={isBookmarked} />
          </button>
          <Link to={`/Questions/${question._id}`} className="question-title-link">
            {question.questionTitle}
          </Link>
        </div>

        <p className="question-body-snippet">{bodySnippet}</p>

        <div className="display-tags-time">
          <div className="display-tags">
            {question.questionTags?.map((tag) => (
              <Link to={`/Tags/${tag}`} key={tag} className="tag-chip">
                {tag}
              </Link>
            ))}
          </div>
          <p className="display-time">
            asked {formatDistanceToNow(new Date(question.askedOn), { addSuffix: true })} by{" "}
            <Link to={`/Users/${question.userId}`} className="author-link">
              {question.userPosted}
            </Link>
            <UserBadge userId={question.userId} />
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Questions);
