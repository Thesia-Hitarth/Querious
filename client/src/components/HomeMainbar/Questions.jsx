import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useSelector, useDispatch } from "react-redux";
import { toggleSaveQuestion } from "../../actions/users";
import UserBadge from "../UserBadge/UserBadge";
import UserPopover from "../UserPopover/UserPopover";
import { getActivityHeat } from "../../utils/activityHeat";
import "../../Pages/Questions/Questions.css";
import { useToast } from "../Toast/ToastContext";

// SVG Bookmark Icon
const BookmarkIconSVG = ({ filled }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "var(--color-warning)" : "none"} stroke={filled ? "var(--color-warning)" : "currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
);

// Status Icon
const StatusIcon = ({ status }) => {
  if (status === "closed") {
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px", display: "inline-block", verticalAlign: "middle" }}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    );
  }
  if (status === "accepted" || status === "answered") {
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px", display: "inline-block", verticalAlign: "middle" }}>
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    );
  }
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px", display: "inline-block", verticalAlign: "middle" }}>
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  );
};

// Helper to strip HTML tags from Rich Text editor content for body snippets
const stripHtml = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
};

const Questions = ({ question }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const User = useSelector((state) => state.currentUserReducer);
  const usersList = useSelector((state) => state.usersReducer) || [];
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
  let statusIconKey = "unanswered";

  if (question.status === "closed") {
    statusText = "Closed";
    statusClass = "status-chip-closed";
    statusIconKey = "closed";
  } else if (question.acceptedAnswerId) {
    statusText = "Accepted";
    statusClass = "status-chip-answered";
    statusIconKey = "accepted";
  } else if (question.noOfAnswers > 0) {
    statusText = "Answered";
    statusClass = "status-chip-answered";
    statusIconKey = "answered";
  }

  // Highlight unanswered posts older than 48 hours
  const isOldUnanswered = !question.acceptedAnswerId && (question.noOfAnswers || 0) === 0 &&
    (new Date() - new Date(question.askedOn)) > 48 * 60 * 60 * 1000;

  const questionUser = usersList.find((u) => u._id === question.userId) || {
    _id: question.userId,
    name: question.userPosted,
    reputation: 1,
  };

  const heat = getActivityHeat(question.updatedAt || question.askedOn);

  return (
    <div className={`question-row display-question-container ${question.acceptedAnswerId ? "accepted-question" : ""} ${isOldUnanswered ? "old-unanswered" : ""}`}>
      {/* Col 1: Avatar */}
      <div className="question-avatar-col">
        <span className="author-avatar-initial">
          {question.userPosted?.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Col 2: Details */}
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
          <span className={`status-chip ${statusClass}`}>
            <StatusIcon status={statusIconKey} />
            {statusText}
          </span>
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
            <p className="display-time">
              asked {formatDistanceToNow(new Date(question.askedOn), { addSuffix: true })} by{" "}
              <UserPopover user={questionUser}>
                <Link to={`/Users/${question.userId}`} className="author-link">
                  {question.userPosted}
                </Link>
              </UserPopover>
              <UserBadge userId={question.userId} />
            </p>
          </div>
        </div>
      </div>

      {/* Col 3: Score */}
      <div className="stat score-stat" title={`${score} score`}>
        <span className="side-stat-number">{score}</span>
        <span className="stat-label">votes</span>
      </div>

      {/* Col 4: Answers */}
      <div className="stat answers-stat" title={`${question.noOfAnswers || 0} answers`}>
        <span className="side-stat-number">{question.noOfAnswers || 0}</span>
        <span className="stat-label">answers</span>
      </div>

      {/* Col 5: Activity / Views */}
      <div className="stat activity-stat" title={`Last active: ${formatDistanceToNow(new Date(question.updatedAt || question.askedOn), { addSuffix: true })}`}>
        <span className="activity-heat-row">
          <span className={`activity-dot ${heat}`} />
          <span className="side-stat-number">{question.views || 0}</span>
        </span>
        <span className="stat-label">views</span>
      </div>

      {/* Mobile Stats Row (Hidden on Desktop) */}
      <div className="stats-mobile-row">
        <span>{score} votes</span>
        <span>•</span>
        <span>{question.noOfAnswers || 0} answers</span>
        <span>•</span>
        <span>{question.views || 0} views</span>
      </div>
    </div>
  );
};

export default React.memo(Questions);
