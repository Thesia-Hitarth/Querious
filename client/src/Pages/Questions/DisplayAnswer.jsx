import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import ReactQuill from "react-quill";

import { deleteAnswer, voteAnswer, acceptAnswer, updateAnswer } from "../../actions/question";
import SafeHtml from "../../components/SafeHtml/SafeHtml";
import Comments from "../../components/Comments/Comments";
import UserBadge from "../../components/UserBadge/UserBadge";
import { useToast } from "../../components/Toast/ToastContext";

// Custom SVGs (18px/20px)
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

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
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

const DisplayAnswer = ({ question, handleShare }) => {
  const User = useSelector((state) => state.currentUserReducer);
  const { id } = useParams();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editAnswerBody, setEditAnswerBody] = useState("");

  const handleEditClick = (ans) => {
    setEditingAnswerId(ans._id);
    setEditAnswerBody(ans.answerBody);
  };

  const handleSaveEdit = (e, answerId) => {
    e.preventDefault();
    if (!editAnswerBody) {
      alert("Answer body cannot be empty");
      return;
    }
    dispatch(updateAnswer(id, answerId, { answerBody: editAnswerBody }));
    showToast("Answer updated successfully!", "success");
    setEditingAnswerId(null);
  };

  const handleDelete = (answerId) => {
    dispatch(deleteAnswer(id, answerId));
    showToast("Answer deleted successfully!", "success");
  };

  const handleUpVote = (answerId) => {
    if (User === null) {
      alert("Login or Signup to vote an answer");
    } else {
      dispatch(voteAnswer(id, answerId, "upVote"));
      showToast("Answer upvoted successfully!", "success");
    }
  };

  const handleDownVote = (answerId) => {
    if (User === null) {
      alert("Login or Signup to vote an answer");
    } else {
      dispatch(voteAnswer(id, answerId, "downVote"));
      showToast("Answer downvoted successfully!", "success");
    }
  };

  const handleAcceptAnswer = (answerId) => {
    if (User === null) {
      alert("Login or Signup to accept an answer");
    } else {
      dispatch(acceptAnswer(id, answerId));
      showToast("Answer status updated!", "success");
    }
  };

  // Add Copy Button to code pre blocks dynamically (Section 10 of micro-interactions)
  useEffect(() => {
    if (question.answer) {
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
  }, [question.answer, editingAnswerId, showToast]);

  const scoreClass = (score) => {
    if (score > 0) return "positive";
    if (score < 0) return "negative";
    return "";
  };

  return (
    <div className="answers-feed-container">
      {question.answer?.map((ans) => {
        const currentScore = (ans.upVote?.length || 0) - (ans.downVote?.length || 0);
        const hasUpvoted = ans.upVote?.includes(User?.result?._id);
        const hasDownvoted = ans.downVote?.includes(User?.result?._id);

        return (
          <div
            className={`display-ans ${ans.isAccepted ? "accepted-answer" : ""}`}
            key={ans._id}
          >
            {ans.isAccepted && (
              <div className="accepted-badge">
                ✓ Accepted
              </div>
            )}
            
            <div className="display-ans-container-2">
              {/* Left voting column */}
              <div className="question-votes">
                <button
                  type="button"
                  className={`votes-icon-btn upvote-btn ${hasUpvoted ? "active" : ""}`}
                  onClick={() => handleUpVote(ans._id)}
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
                  onClick={() => handleDownVote(ans._id)}
                  title="Downvote"
                >
                  <DownVoteIcon />
                </button>

                {(String(User?.result?._id) === String(question.userId) || ans.isAccepted) && (
                  <button
                    type="button"
                    className={`accept-checkmark-btn ${ans.isAccepted ? "accepted" : ""}`}
                    onClick={() => handleAcceptAnswer(ans._id)}
                    disabled={String(User?.result?._id) !== String(question.userId)}
                    title={
                      ans.isAccepted ? "Accepted answer" : "Accept this answer"
                    }
                  >
                    <CheckIcon />
                  </button>
                )}
              </div>

              {/* Right content column */}
              <div style={{ width: "100%", minWidth: 0 }}>
                {editingAnswerId === ans._id ? (
                  <form onSubmit={(e) => handleSaveEdit(e, ans._id)}>
                    <div className="editor-wrapper">
                      <ReactQuill
                        theme="snow"
                        value={editAnswerBody}
                        onChange={setEditAnswerBody}
                        modules={modules}
                        formats={formats}
                      />
                    </div>
                    <div className="edit-form-buttons" style={{ marginBottom: "var(--space-4)" }}>
                      <button type="submit" className="btn btn-primary" style={{ marginRight: "var(--space-2)" }}>Save</button>
                      <button type="button" onClick={() => setEditingAnswerId(null)} className="btn btn-ghost">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="prose">
                      <SafeHtml content={ans.answerBody} />
                    </div>
                    {ans.editedOn && (
                      <div className="edit-time-line">
                        <p className="author-date" style={{ textAlign: "right" }}>
                          edited {formatDistanceToNow(new Date(ans.editedOn), { addSuffix: true })}
                        </p>
                      </div>
                    )}
                  </>
                )}
                
                <div className="question-actions-user">
                  <div className="question-action-btns">
                    <button type="button" onClick={handleShare}>
                      Share
                    </button>
                    {User?.result?._id === ans?.userId && (
                      <>
                        {editingAnswerId !== ans._id && (
                          <button type="button" onClick={() => handleEditClick(ans)}>
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-danger"
                          onClick={() => handleDelete(ans._id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                  <div className="question-author-meta">
                    <div className="author-info-text">
                      <span className="author-date">answered {formatDistanceToNow(new Date(ans.answeredOn), { addSuffix: true })}</span>
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
                        <Link to={`/Users/${ans.userId}`} className="author-link">
                          {ans.userAnswered}
                        </Link>
                        <UserBadge userId={ans.userId} />
                      </div>
                    </div>
                  </div>
                </div>
                
                <Comments
                  questionId={id}
                  parentId={ans._id}
                  comments={ans.comments}
                  type="answer"
                  postOwnerId={ans.userId}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DisplayAnswer;
