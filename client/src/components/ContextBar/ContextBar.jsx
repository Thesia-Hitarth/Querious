import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import copy from "copy-to-clipboard";
import { useToast } from "../Toast/ToastContext";
import VoteRail from "../VoteRail/VoteRail";
import { voteQuestion } from "../../actions/question";
import { toggleSaveQuestion } from "../../actions/users";
import "./ContextBar.css";

const BookmarkIconSVG = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "var(--color-warning)" : "none"} stroke={filled ? "var(--color-warning)" : "currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
);

const ContextBar = () => {
  const location = useLocation();
  const params = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const User = useSelector((state) => state.currentUserReducer);
  const questionsList = useSelector((state) => state.questionsReducer);
  const userDetails = useSelector((state) => state.userDetailsReducer);

  const [isVoting, setIsVoting] = useState(false);

  // Build breadcrumb segments from route
  const segments = [{ label: "Home", to: "/" }];
  
  if (params.tag) {
    segments.push({ label: `#${params.tag}`, to: `/Tags/${params.tag}` });
  } else if (params.collectiveId) {
    segments.push({ label: params.collectiveId, to: `/Collectives/${params.collectiveId}` });
  } else if (location.pathname.startsWith("/Questions/")) {
    const idParam = location.pathname.split("/")[2];
    if (idParam && idParam !== "AskQuestion") {
      const question = questionsList.data?.find((q) => q._id === idParam);
      segments.push({ label: question?.questionTitle || "Question", to: null });
    }
  } else if (location.pathname.startsWith("/Users/")) {
    const idParam = location.pathname.split("/")[2];
    if (idParam) {
      const nameLabel = userDetails && userDetails._id === idParam ? userDetails.name : "Profile";
      segments.push({ label: nameLabel, to: null });
    }
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

  const isQuestionPage = location.pathname.startsWith("/Questions/") && location.pathname.split("/")[2] !== "AskQuestion";
  const questionId = isQuestionPage ? location.pathname.split("/")[2] : null;
  const question = questionId ? questionsList.data?.find((q) => q._id === questionId) : null;

  const handleUpVote = async () => {
    if (User === null) {
      showToast("Please login or signup to vote", "warning");
      navigate("/Auth");
      return;
    }
    setIsVoting(true);
    try {
      await dispatch(voteQuestion(questionId, "upVote"));
    } catch (err) {
      console.error(err);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDownVote = async () => {
    if (User === null) {
      showToast("Please login or signup to vote", "warning");
      navigate("/Auth");
      return;
    }
    setIsVoting(true);
    try {
      await dispatch(voteQuestion(questionId, "downVote"));
    } catch (err) {
      console.error(err);
    } finally {
      setIsVoting(false);
    }
  };

  const handleBookmarkClick = async () => {
    if (User === null) {
      showToast("Please login or signup to bookmark a question", "warning");
      navigate("/Auth");
      return;
    }
    const alreadySaved = User?.result?.savedQuestions?.includes(questionId);
    try {
      await dispatch(toggleSaveQuestion(User.result._id, questionId));
      showToast(alreadySaved ? "Bookmark removed!" : "Question bookmarked!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update bookmark", "error");
    }
  };

  const handleShare = () => {
    copy(window.location.origin + location.pathname);
    showToast("Link copied to clipboard!", "success");
  };

  return (
    <nav className="context-bar" aria-label="Breadcrumb">
      <div className="context-bar-inner">
        <div className="context-bar-breadcrumbs">
          {segments.map((seg, i) => (
            <span key={i} className="context-bar-segment">
              {seg.to ? <Link to={seg.to}>{seg.label}</Link> : <span>{seg.label}</span>}
              {i < segments.length - 1 && <span className="context-bar-sep">/</span>}
            </span>
          ))}
        </div>

        {question && (
          <div className="context-bar-actions">
            <VoteRail
              score={(question.upVote?.length || 0) - (question.downVote?.length || 0)}
              onUpVote={handleUpVote}
              onDownVote={handleDownVote}
              userUpVoted={question.upVote?.includes(User?.result?._id)}
              userDownVoted={question.downVote?.includes(User?.result?._id)}
              isVoting={isVoting}
              orientation="horizontal"
            />
            <button
              type="button"
              className="btn-ghost"
              onClick={handleShare}
            >
              Share
            </button>
            <button
              type="button"
              className="bookmark-btn"
              onClick={handleBookmarkClick}
              title={User?.result?.savedQuestions?.includes(question._id) ? "Remove bookmark" : "Bookmark this question"}
            >
              <BookmarkIconSVG filled={User?.result?.savedQuestions?.includes(question._id)} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default ContextBar;
