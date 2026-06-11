import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { formatDistanceToNow } from "date-fns";
import copy from "copy-to-clipboard";
import ReactQuill from "react-quill";

import "./Questions.css";
import DisplayAnswer from "./DisplayAnswer";
import LoadingSkeleton from "../../components/LoadingSkeleton/LoadingSkeleton";
import SafeHtml from "../../components/SafeHtml/SafeHtml";
import Comments from "../../components/Comments/Comments";
import UserBadge from "../../components/UserBadge/UserBadge";
import { toggleSaveQuestion } from "../../actions/users";
import {
  postAnswer,
  deleteQuestion,
  voteQuestion,
  updateQuestion,
} from "../../actions/question";
import { useToast } from "../../components/Toast/ToastContext";

// Custom SVGs
const UpVoteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);

const DownVoteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

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
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editTags, setEditTags] = useState("");

  const Navigate = useNavigate();
  const dispatch = useDispatch();
  const User = useSelector((state) => state.currentUserReducer);
  const location = useLocation();
  const url = process.env.REACT_APP_CLIENT_URL || window.location.origin;
  const { showToast } = useToast();

  const handlePostAns = (e, answerLength) => {
    e.preventDefault();
    if (User === null) {
      alert("Login or Signup to answer a question");
      Navigate("/Auth");
    } else {
      if (Answer === "") {
        alert("Enter an answer before submitting");
      } else {
        dispatch(
          postAnswer({
            id,
            noOfAnswers: answerLength + 1,
            answerBody: Answer,
            userAnswered: User.result.name,
          })
        );
        showToast("Answer posted successfully!", "success");
        setAnswer("");
      }
    }
  };

  const handleShare = () => {
    copy(url + location.pathname);
    alert("Copied url : " + url + location.pathname);
  };

  const handleDelete = () => {
    dispatch(deleteQuestion(id, Navigate));
    showToast("Question deleted successfully!", "success");
  };

  const handleEditClick = (question) => {
    setIsEditing(true);
    setEditTitle(question.questionTitle);
    setEditBody(question.questionBody);
    setEditTags(question.questionTags.join(" "));
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editTitle || !editBody || !editTags) {
      alert("Please fill in all fields");
      return;
    }
    dispatch(
      updateQuestion(id, {
        questionTitle: editTitle,
        questionBody: editBody,
        questionTags: editTags.trim().split(/\s+/),
      })
    );
    showToast("Question updated successfully!", "success");
    setIsEditing(false);
  };

  const handleUpVote = () => {
    if (User === null) {
      alert("Login or Signup to up vote a question");
      Navigate("/Auth");
    } else {
      dispatch(voteQuestion(id, "upVote"));
      showToast("Upvoted successfully!", "success");
    }
  };

  const handleDownVote = () => {
    if (User === null) {
      alert("Login or Signup to down vote a question");
      Navigate("/Auth");
    } else {
      dispatch(voteQuestion(id, "downVote"));
      showToast("Downvoted successfully!", "success");
    }
  };

  const handleBookmarkClick = (questionId) => {
    if (User === null) {
      alert("Login or Signup to bookmark a question");
      Navigate("/Auth");
    } else {
      dispatch(toggleSaveQuestion(User.result._id, questionId));
      const alreadySaved = User?.result?.savedQuestions?.includes(questionId);
      showToast(alreadySaved ? "Bookmark removed!" : "Question bookmarked!", "success");
    }
  };

  // Add Copy Button to code pre blocks dynamically (Section 10 of micro-interactions)
  useEffect(() => {
    if (questionsList.data) {
      const preBlocks = document.querySelectorAll(".prose pre");
      preBlocks.forEach((pre) => {
        if (pre.querySelector(".code-copy-btn")) return;

        const button = document.createElement("button");
        button.className = "code-copy-btn";
        button.type = "button";
        button.innerText = "Copy";

        button.addEventListener("click", async () => {
          const codeText = pre.querySelector("code")?.innerText || pre.innerText.replace(/Copy$/, "");
          try {
            await navigator.clipboard.writeText(codeText);
            button.innerText = "Copied ✓";
            showToast("Code copied to clipboard!", "success");
            setTimeout(() => {
              button.innerText = "Copy";
            }, 2000);
          } catch (err) {
            console.error("Failed to copy code block:", err);
            showToast("Failed to copy code block", "error");
          }
        });

        pre.appendChild(button);
      });
    }
  }, [questionsList.data, Answer, isEditing]);

  const scoreClass = (score) => {
    if (score > 0) return "positive";
    if (score < 0) return "negative";
    return "";
  };

  return (
    <div className="question-details-page">
      {questionsList.data === null ? (
        <LoadingSkeleton type="question-detail" count={1} />
      ) : (
        <>
          {questionsList.data
            .filter((question) => question._id === id)
            .map((question) => {
              const currentScore = (question.upVote?.length || 0) - (question.downVote?.length || 0);
              const isSaved = User?.result?.savedQuestions?.includes(question._id);
              const hasUpvoted = question.upVote?.includes(User?.result?._id);
              const hasDownvoted = question.downVote?.includes(User?.result?._id);

              return (
                <div key={question._id}>
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
                              />
                            </div>
                          </div>
                          <div className="form-group">
                            <label htmlFor="edit-tags">Tags (space-separated)</label>
                            <input
                              id="edit-tags"
                              type="text"
                              value={editTags}
                              onChange={(e) => setEditTags(e.target.value)}
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
                        <h1>{question.questionTitle}</h1>
                        <div className="question-details-meta">
                          <span>Asked <strong>{formatDistanceToNow(new Date(question.askedOn), { addSuffix: true })}</strong></span>
                          {question.editedOn && <span>Active <strong>{formatDistanceToNow(new Date(question.editedOn), { addSuffix: true })}</strong></span>}
                          <span>Viewed <strong>{question.views || 0} times</strong></span>
                        </div>
                      </div>
                      
                      <div className="question-details-container-2">
                        {/* Voting column */}
                        <div className="question-votes">
                          <button
                            type="button"
                            className={`votes-icon-btn upvote-btn ${hasUpvoted ? "active" : ""}`}
                            onClick={handleUpVote}
                            title="Upvote"
                          >
                            <UpVoteIcon />
                          </button>
                          <p className={`vote-score ${scoreClass(currentScore)}`}>
                            {currentScore}
                          </p>
                          <button
                            type="button"
                            className={`votes-icon-btn downvote-btn ${hasDownvoted ? "active" : ""}`}
                            onClick={handleDownVote}
                            title="Downvote"
                          >
                            <DownVoteIcon />
                          </button>
                          <button
                            type="button"
                            className="bookmark-btn"
                            onClick={() => handleBookmarkClick(question._id)}
                            title={isSaved ? "Remove bookmark" : "Bookmark this question"}
                          >
                            <BookmarkIconSVG filled={isSaved} />
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
                              {User?.result?._id === question?.userId && (
                                <>
                                  <button type="button" onClick={() => handleEditClick(question)}>
                                    Edit
                                  </button>
                                  <button type="button" className="text-danger" onClick={handleDelete}>
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                            <div className="question-author-meta">
                              <div className="author-info-text">
                                <span className="author-date">asked {formatDistanceToNow(new Date(question.askedOn), { addSuffix: true })}</span>
                                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
                                  <Link to={`/Users/${question.userId}`} className="author-link">
                                    {question.userPosted}
                                  </Link>
                                  <UserBadge userId={question.userId} />
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
                  {question.noOfAnswers !== 0 && (
                    <section>
                      <h3 className="answers-section-title">{question.noOfAnswers} Answers</h3>
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
                        handlePostAns(e, question.answer?.length || 0);
                      }}
                    >
                      <div className="editor-wrapper">
                        <ReactQuill
                          theme="snow"
                          value={Answer}
                          onChange={setAnswer}
                          modules={modules}
                          formats={formats}
                        />
                      </div>
                      <input
                        type="submit"
                        className="btn btn-primary"
                        value="Post Your Answer"
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
                </div>
              );
            })}
        </>
      )}
    </div>
  );
};

export default QuestionsDetails;
