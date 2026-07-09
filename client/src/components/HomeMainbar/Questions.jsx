import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useSelector, useDispatch } from "react-redux";
import { toggleSaveQuestion } from "../../actions/users";
import UserBadge from "../UserBadge/UserBadge";
import VoteRail from "../VoteRail/VoteRail";
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

  // Compute status chip details
  let statusText = "Unanswered";
  let statusClass = "status-chip-unanswered";
  if (question.status === "closed") {
    statusText = "Closed";
    statusClass = "status-chip-closed";
  } else if (question.acceptedAnswerId) {
    statusText = "Accepted";
    statusClass = "status-chip-answered";
  } else if (question.noOfAnswers > 0) {
    statusText = "Answered";
    statusClass = "status-chip-answered";
  }

  // Highlight unanswered posts older than 48 hours
  const isOldUnanswered = !question.acceptedAnswerId && (question.noOfAnswers || 0) === 0 &&
    (new Date() - new Date(question.askedOn)) > 48 * 60 * 60 * 1000;

  return (
    <div className={`question-card display-question-container ${question.acceptedAnswerId ? "accepted-question" : ""} ${isOldUnanswered ? "old-unanswered" : ""}`}>
      {/* Left Column: Vote Rail */}
      <div className="question-left-col">
        <VoteRail score={score} />
      </div>

      {/* Main Content Column */}
      <div className="display-question-details">
        <div className="question-meta-top">
          <span className={`status-chip ${statusClass}`}>{statusText}</span>
        </div>

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
          <div className="display-author-info">
            <span className="author-avatar-initial">
              {question.userPosted?.charAt(0).toUpperCase()}
            </span>
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

      {/* Right Column: Mini Stats */}
      <div className="question-right-stats-col">
        <div className="question-side-stat" title={`${question.noOfAnswers || 0} answers`}>
          <span className="side-stat-number">{question.noOfAnswers || 0}</span>
          <span className="side-stat-label">answers</span>
        </div>
        <div className="question-side-stat" title={`${question.views || 0} views`}>
          <span className="side-stat-number">{question.views || 0}</span>
          <span className="side-stat-label">views</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Questions);
