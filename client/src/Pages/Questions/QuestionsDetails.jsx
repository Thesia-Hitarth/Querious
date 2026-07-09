import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { formatDistanceToNow } from "date-fns";
import copy from "copy-to-clipboard";
import ReactQuill from "react-quill";

import "./Questions.css";
import DisplayAnswer from "./DisplayAnswer";
import UserPopover from "../../components/UserPopover/UserPopover";
import VoteRail from "../../components/VoteRail/VoteRail";
import LoadingSkeleton from "../../components/LoadingSkeleton/LoadingSkeleton";
import SafeHtml from "../../components/SafeHtml/SafeHtml";
import Comments from "../../components/Comments/Comments";
import UserBadge from "../../components/UserBadge/UserBadge";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import TagInput from "../../components/TagInput/TagInput";
import FlagModal from "../../components/FlagModal/FlagModal";
import { toggleSaveQuestion } from "../../actions/users";
import {
  postAnswer,
  deleteQuestion,
  voteQuestion,
  updateQuestion,
  fetchQuestionDetails,
  toggleWatchQuestion,
} from "../../actions/question";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import { useToast } from "../../components/Toast/ToastContext";

// Custom SVGs


const BookmarkIconSVG = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "var(--color-warning)" : "none"} stroke={filled ? "var(--color-warning)" : "currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
);

const modules = {
  toolbar: [
    ["bold", "italic", "underline", "blockquote"],
    ["code", "code-block"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    ["clean"],
  ],
};

const formats = [
  "bold",
  "italic",
  "underline",
  "blockquote",
  "code",
  "code-block",
  "list",
  "bullet",
  "link",
  "image",
];

const QuestionsDetails = () => {
  const { id } = useParams();
  const questionsList = useSelector((state) => state.questionsReducer);

  const [Answer, setAnswer] = useState("");
  const [quillKey, setQuillKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editTags, setEditTags] = useState([]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);

  const Navigate = useNavigate();
  const dispatch = useDispatch();
  const User = useSelector((state) => state.currentUserReducer);
  const location = useLocation();
  const url = window.location.origin;
  const { showToast } = useToast();

  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    dispatch(fetchQuestionDetails(id)).catch((err) => {
      console.error("Error fetching question details:", err);
    });
  }, [id, dispatch]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const question = questionsList.data?.find((q) => q._id === id);
  const questionUser = {
    _id: question?.userId,
    name: question?.userPosted,
    reputation: question?.userReputation || 1,
    badges: question?.userBadges || { gold: 0, silver: 0, bronze: 0 }
  };

  useDocumentMeta({
    title: question?.questionTitle,
    description: question?.questionBody?.replace(/<[^>]+>/g, "").substring(0, 155),
    keywords: question?.questionTags?.join(", "),
    ogTitle: question?.questionTitle,
    ogDescription: question?.questionBody?.replace(/<[^>]+>/g, "").substring(0, 155),
  });

  let statusText = "Unanswered";
  let statusClass = "status-chip-unanswered";
  if (question?.status === "closed") {
    statusText = "Closed";
    statusClass = "status-chip-closed";
  } else if (question?.acceptedAnswerId) {
    statusText = "Accepted";
    statusClass = "status-chip-answered";
  } else if (question?.noOfAnswers > 0) {
    statusText = "Answered";
    statusClass = "status-chip-answered";
  }

  const handleWatchClick = async () => {
    if (!User) {
      showToast("Please login or signup to watch this question", "warning");
      return;
    }
    try {
      await dispatch(toggleWatchQuestion(id));
      const isWatching = !question.watchers?.includes(User?.result?._id);
      showToast(isWatching ? "You are now watching this question." : "You stopped watching this question.", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update watch status.", "danger");
    }
  };

  const handlePostAns = async (e) => {
    e.preventDefault();
    if (User === null) {
      showToast("Please login or signup to answer a question", "warning");
      Navigate("/Auth");
    } else {
      if (Answer.trim() === "" || Answer === "<p><br></p>") {
        showToast("Enter an answer before submitting", "error");
      } else if (Answer.replace(/<[^>]+>/g, "").length > 30000) {
        showToast("Answer body cannot exceed 30,000 characters", "error");
      } else {
        setIsSubmittingAnswer(true);
        try {
          await dispatch(
            postAnswer({
              id,
              answerBody: Answer,
              userAnswered: User.result.name,
            })
          );
          showToast("Answer posted successfully!", "success");
          setAnswer("");
          setQuillKey((prev) => prev + 1); // Reset ReactQuill editor completely
          setTimeout(() => {
            document.querySelector(".answers-section-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 150);
        } catch (error) {
          showToast("Failed to post answer. Please try again.", "error");
        } finally {
          setIsSubmittingAnswer(false);
        }
      }
    }
  };

  const handleShare = () => {
    copy(url + location.pathname);
    showToast("URL copied to clipboard!", "success");
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      await dispatch(deleteQuestion(id, Navigate));
      showToast("Question deleted successfully!", "success");
    } catch (err) {
      showToast("Failed to delete question. Please try again.", "error");
    }
  };

  const handleEditClick = (quest) => {
    setIsEditing(true);
    setEditTitle(quest.questionTitle);
    setEditBody(quest.questionBody);
    setEditTags(quest.questionTags || []);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle || !editBody || editTags.length === 0) {
      showToast("Please fill in all fields", "error");
      return;
    }
    if (editTitle.length > 300) {
      showToast("Title cannot exceed 300 characters", "error");
      return;
    }
    if (editBody.replace(/<[^>]+>/g, "").length > 30000) {
      showToast("Body cannot exceed 30,000 characters", "error");
      return;
    }
    try {
      const res = await dispatch(
        updateQuestion(id, {
          questionTitle: editTitle,
          questionBody: editBody,
          questionTags: editTags,
        })
      );
      if (res?.status === "suggested") {
        showToast(res.message, "success");
      } else {
        showToast("Question updated successfully!", "success");
      }
      setIsEditing(false);
    } catch (err) {
      showToast("Failed to update question. Please try again.", "error");
    }
  };

  const handleUpVote = async () => {
    if (User === null) {
      showToast("Please login or signup to up vote a question", "warning");
      Navigate("/Auth");
    } else if (!question || User?.result?._id === question.userId) {
      showToast("You cannot vote on your own question", "warning");
    } else if (!isVoting) {
      try {
        setIsVoting(true);
        await dispatch(voteQuestion(id, "upVote"));
        showToast("Vote updated successfully!", "success");
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to upvote", "error");
      } finally {
        setIsVoting(false);
      }
    }
  };

  const handleDownVote = async () => {
    if (User === null) {
      showToast("Please login or signup to down vote a question", "warning");
      Navigate("/Auth");
    } else if (!question || User?.result?._id === question.userId) {
      showToast("You cannot vote on your own question", "warning");
    } else if (!isVoting) {
      try {
        setIsVoting(true);
        await dispatch(voteQuestion(id, "downVote"));
        showToast("Vote updated successfully!", "success");
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to downvote", "error");
      } finally {
        setIsVoting(false);
      }
    }
  };

  const handleBookmarkClick = async (questionId) => {
    if (User === null) {
      showToast("Please login or signup to bookmark a question", "warning");
      Navigate("/Auth");
    } else {
      const alreadySaved = User?.result?.savedQuestions?.includes(questionId);
      try {
        await dispatch(toggleSaveQuestion(User.result._id, questionId));
        showToast(alreadySaved ? "Bookmark removed!" : "Question bookmarked!", "success");
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to update bookmark", "error");
      }
    }
  };



  return (
    <div className="question-details-page">
      {!questionsList.data ? (
        <LoadingSkeleton type="question-detail" count={1} />
      ) : !question ? (
        <section className="question-details-container" style={{ textAlign: "center", padding: "40px" }}>
          <h2>Question not found</h2>
          <p style={{ margin: "20px 0 30px", color: "var(--color-text-secondary)" }}>
            The question you are looking for does not exist or has been deleted.
          </p>
          <Link to="/" className="btn btn-primary" style={{ textDecoration: "none", padding: "10px 20px" }}>
            Back to Home
          </Link>
        </section>
      ) : (
        <>
          {isEditing ? (
            <section className="question-details-container edit-question-form">
              <h2>Edit Question</h2>
              <form onSubmit={handleSaveEdit}>
                <div className="ask-form-container">
                  <div className="form-group">
                    <label htmlFor="edit-title">Title</label>
                    <input
                      id="edit-title"
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      maxLength={300}
                    />
                  </div>
                  <div className="form-group">
                    <label>Body</label>
                    <div className="editor-wrapper">
                      <ReactQuill
                        theme="snow"
                        value={editBody}
                        onChange={setEditBody}
                        modules={modules}
                        formats={formats}
                        placeholder="Type your question body here..."
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Tags</label>
                    <TagInput
                      key={isEditing ? "edit" : "view"}
                      tags={editTags}
                      onChange={setEditTags}
                      placeholder="Add tags (up to 5)..."
                    />
                  </div>
                  <div className="edit-form-buttons">
                    <button type="submit" className="btn btn-primary">Save</button>
                    <button type="button" onClick={() => setIsEditing(false)} className="btn btn-ghost">Cancel</button>
                  </div>
                </div>
              </form>
            </section>
          ) : (
            <section className="question-details-container">
              <div className="question-details-header">
                <div className="question-meta-top" style={{ marginBottom: "var(--space-2)" }}>
                  <span className={`status-chip ${statusClass}`}>{statusText}</span>
                </div>
                <h1>{question.questionTitle}</h1>
                <div className="question-details-meta">
                  <span>Asked <strong>{formatDistanceToNow(new Date(question.askedOn), { addSuffix: true })}</strong></span>
                  <span className="meta-separator" aria-hidden="true">·</span>
                  {question.editedOn && (
                    <>
                      <span>Active <strong>{formatDistanceToNow(new Date(question.editedOn), { addSuffix: true })}</strong></span>
                      <span className="meta-separator" aria-hidden="true">·</span>
                    </>
                  )}
                  <span>Viewed <strong>{question.views || 0} times</strong></span>
                </div>
              </div>

              <div className="question-details-container-2">
                {/* Voting column */}
                <div className="question-votes-col-wrapper" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)" }}>
                  {(() => {
                    const hasUpvoted = question.upVote?.includes(User?.result?._id);
                    const hasDownvoted = question.downVote?.includes(User?.result?._id);
                    const currentScore = (question.upVote?.length || 0) - (question.downVote?.length || 0);

                    return (
                      <VoteRail
                        score={currentScore}
                        onUpVote={handleUpVote}
                        onDownVote={handleDownVote}
                        userUpVoted={hasUpvoted}
                        userDownVoted={hasDownvoted}
                        isVoting={isVoting}
                      />
                    );
                  })()}
                  <button
                    type="button"
                    className="bookmark-btn"
                    onClick={() => handleBookmarkClick(question._id)}
                    title={User?.result?.savedQuestions?.includes(question._id) ? "Remove bookmark" : "Bookmark this question"}
                  >
                    <BookmarkIconSVG filled={User?.result?.savedQuestions?.includes(question._id)} />
                  </button>
                </div>

                {/* Content column */}
                <div className="question-body-content">
                  <div className="prose">
                    <SafeHtml content={question.questionBody} />
                  </div>
                  <div className="display-tags">
                    {question.questionTags.map((tag) => (
                      <Link to={`/Tags/${tag}`} key={tag} className="tag-chip">
                        {tag}
                      </Link>
                    ))}
                  </div>
                  {question.editedOn && (
                    <div className="edit-time-line">
                      <p className="author-date">
                        edited {formatDistanceToNow(new Date(question.editedOn), { addSuffix: true })} by {question.editedBy}
                      </p>
                    </div>
                  )}
                  <div className="question-actions-user">
                    <div className="question-action-btns">
                      <button type="button" onClick={handleShare}>
                        Share
                      </button>
                      {User && (
                        <button
                          type="button"
                          className={question.watchers?.includes(User?.result?._id) ? "text-primary font-semibold" : "text-muted"}
                          onClick={handleWatchClick}
                        >
                          {question.watchers?.includes(User?.result?._id) ? "Watching ✓" : "Watch"}
                        </button>
                      )}
                      {User && (
                        <button type="button" onClick={() => handleEditClick(question)}>
                          Edit
                        </button>
                      )}
                      {User?.result?._id === question?.userId && (
                        <button type="button" className="text-danger" onClick={handleDeleteClick}>
                          Delete
                        </button>
                      )}
                      {User?.result?._id !== question?.userId && User && (
                        <button type="button" className="text-muted" onClick={() => setIsFlagModalOpen(true)}>
                          Flag
                        </button>
                      )}
                    </div>
                    <div className="question-author-meta">
                      <div className="author-info-text">
                        <span className="author-date">asked {formatDistanceToNow(new Date(question.askedOn), { addSuffix: true })}</span>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
                          <UserPopover user={questionUser}>
                            <Link to={`/Users/${question.userId}`} className="author-link">
                              {question.userPosted}
                            </Link>
                          </UserPopover>
                          <UserBadge userId={question.userId} reputation={question.userReputation} badges={question.userBadges} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <Comments
                    questionId={question._id}
                    parentId={question._id}
                    comments={question.comments}
                    type="question"
                    postOwnerId={question.userId}
                  />
                </div>
              </div>
            </section>
          )}
          {question.answer && question.answer.length !== 0 && (
            <section>
              <h3 className="answers-section-title">{question.answer.length} Answers</h3>
              <DisplayAnswer
                key={question._id}
                question={question}
                handleShare={handleShare}
              />
            </section>
          )}
          <section className="post-ans-container">
            <h3>Your Answer</h3>
            <form
              onSubmit={(e) => {
                handlePostAns(e);
              }}
            >
              <div className="editor-wrapper">
                <ReactQuill
                  key={quillKey}
                  theme="snow"
                  value={Answer}
                  onChange={setAnswer}
                  modules={modules}
                  formats={formats}
                  placeholder="Type your answer here..."
                />
              </div>
              <input
                type="submit"
                className="btn btn-primary"
                value={isSubmittingAnswer ? "Posting..." : "Post Your Answer"}
                disabled={isSubmittingAnswer}
              />
            </form>
            <p style={{ marginTop: "var(--space-4)", fontSize: "14px", color: "var(--color-text-secondary)" }}>
              Browse other questions tagged{" "}
              {question.questionTags.map((tag) => (
                <Link to={`/Tags/${tag}`} key={tag} className="tag-chip" style={{ margin: "0 2px" }}>
                  {tag}
                </Link>
              ))}{" "}
              or{" "}
              <Link
                to="/AskQuestion"
                style={{ color: "var(--color-brand-secondary)", fontWeight: "600", textDecoration: "underline" }}
              >
                ask your own question.
              </Link>
            </p>
          </section>

          <ConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleConfirmDelete}
            title="Delete Question"
            message="Are you sure you want to delete this question? This action cannot be undone."
          />

          <FlagModal
            isOpen={isFlagModalOpen}
            onClose={() => setIsFlagModalOpen(false)}
            targetType="question"
            targetId={question._id}
            questionId={question._id}
          />

          {showStickyBar && question && (
            <div className="sticky-question-action-bar">
              <div className="sticky-action-bar-content">
                <span className="sticky-bar-title">{question.questionTitle}</span>
                <div className="sticky-bar-actions">
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
                    className="btn btn-ghost"
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                    onClick={handleShare}
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    className="bookmark-btn"
                    style={{ padding: "6px" }}
                    onClick={() => handleBookmarkClick(question._id)}
                    title={User?.result?.savedQuestions?.includes(question._id) ? "Remove bookmark" : "Bookmark this question"}
                  >
                    <BookmarkIconSVG filled={User?.result?.savedQuestions?.includes(question._id)} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuestionsDetails;
