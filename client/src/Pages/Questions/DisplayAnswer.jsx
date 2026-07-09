import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import ReactQuill from "react-quill";

import { deleteAnswer, voteAnswer, acceptAnswer, updateAnswer, flagAnswerOutdated, clearAnswerOutdated } from "../../actions/question";
import VoteRail from "../../components/VoteRail/VoteRail";
import SafeHtml from "../../components/SafeHtml/SafeHtml";
import Comments from "../../components/Comments/Comments";
import UserBadge from "../../components/UserBadge/UserBadge";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import { useToast } from "../../components/Toast/ToastContext";
import FlagModal from "../../components/FlagModal/FlagModal";

// Custom SVGs (18px/20px)


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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAnswerId, setDeleteAnswerId] = useState(null);
  const [votingAnswerId, setVotingAnswerId] = useState(null);
  const [flagAnswerId, setFlagAnswerId] = useState(null);

  const handleEditClick = (ans) => {
    setEditingAnswerId(ans._id);
    setEditAnswerBody(ans.answerBody);
  };

  const handleSaveEdit = async (e, answerId) => {
    e.preventDefault();
    if (!editAnswerBody) {
      showToast("Answer body cannot be empty", "error");
      return;
    }
    if (editAnswerBody.replace(/<[^>]+>/g, "").length > 30000) {
      showToast("Answer cannot exceed 30,000 characters", "error");
      return;
    }
    try {
      const res = await dispatch(updateAnswer(id, answerId, { answerBody: editAnswerBody }));
      if (res?.status === "suggested") {
        showToast(res.message, "success");
      } else {
        showToast("Answer updated successfully!", "success");
      }
      setEditingAnswerId(null);
    } catch (err) {
      showToast("Failed to update answer. Please try again.", "error");
    }
  };

  const handleDeleteClick = (answerId) => {
    setDeleteAnswerId(answerId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (deleteAnswerId) {
      try {
        await dispatch(deleteAnswer(id, deleteAnswerId));
        showToast("Answer deleted successfully!", "success");
      } catch (err) {
        showToast("Failed to delete answer. Please try again.", "error");
      } finally {
        setDeleteAnswerId(null);
      }
    }
  };

  const handleUpVote = async (answerId, answerUserId) => {
    if (User === null) {
      showToast("Please login or signup to vote", "warning");
    } else if (User?.result?._id === answerUserId) {
      showToast("You cannot vote on your own answer", "warning");
    } else {
      try {
        setVotingAnswerId(answerId);
        await dispatch(voteAnswer(id, answerId, "upVote"));
        showToast("Answer upvoted successfully!", "success");
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to upvote answer", "error");
      } finally {
        setVotingAnswerId(null);
      }
    }
  };

  const handleDownVote = async (answerId, answerUserId) => {
    if (User === null) {
      showToast("Please login or signup to vote", "warning");
    } else if (User?.result?._id === answerUserId) {
      showToast("You cannot vote on your own answer", "warning");
    } else {
      try {
        setVotingAnswerId(answerId);
        await dispatch(voteAnswer(id, answerId, "downVote"));
        showToast("Answer downvoted successfully!", "success");
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to downvote answer", "error");
      } finally {
        setVotingAnswerId(null);
      }
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    if (User === null) {
      showToast("Please login or signup to accept an answer", "warning");
    } else {
      try {
        await dispatch(acceptAnswer(id, answerId));
        showToast("Answer status updated!", "success");
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to update answer status", "error");
      }
    }
  };

  const handleFlagOutdated = async (answerId) => {
    if (User === null) {
      showToast("Please login or signup to flag an answer as outdated", "warning");
      return;
    }
    try {
      const reason = prompt("Enter a brief reason why this answer is outdated (optional):");
      if (reason === null) return; // user cancelled
      await dispatch(flagAnswerOutdated(id, answerId, reason));
      showToast("Answer flagged as outdated.", "success");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        showToast("You have already flagged this answer as outdated.", "warning");
      } else {
        showToast(err.response?.data?.message || "Failed to mark as outdated.", "danger");
      }
    }
  };

  const handleClearOutdated = async (answerId) => {
    try {
      await dispatch(clearAnswerOutdated(id, answerId));
      showToast("Outdated flags cleared.", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to clear flags.", "danger");
    }
  };





  // Sort answers to push accepted answer to top, secondary sort by net votes score descending
  const sortedAnswers = [...(question.answer || [])].sort((a, b) => {
    if (a.isAccepted !== b.isAccepted) {
      return b.isAccepted - a.isAccepted;
    }
    const scoreA = (a.upVote?.length || 0) - (a.downVote?.length || 0);
    const scoreB = (b.upVote?.length || 0) - (b.downVote?.length || 0);
    return scoreB - scoreA;
  });

  return (
    <div className="answers-feed-container">
      {sortedAnswers.map((ans) => {
        const currentScore = (ans.upVote?.length || 0) - (ans.downVote?.length || 0);
        const hasUpvoted = ans.upVote?.includes(User?.result?._id);
        const hasDownvoted = ans.downVote?.includes(User?.result?._id);

        return (
          <React.Fragment key={ans._id}>
            {ans.isAccepted && (
              <div className="accepted-answer-header">
                <span className="accepted-header-badge">
                  <CheckIcon /> Accepted Answer
                </span>
              </div>
            )}
            <div
              className={`display-ans ${ans.isAccepted ? "accepted-answer" : ""}`}
            >
              {ans.isAccepted && (
                <div className="accepted-badge">
                  ✓ Accepted
                </div>
              )}
              
              {ans.outdatedFlags?.length >= 3 && (
                <div className="outdated-answer-banner" style={{ display: "flex", gap: "10px", alignItems: "center", backgroundColor: "#fdf2e9", color: "#c85a17", border: "1px solid #fbd0b4", padding: "10px 16px", borderRadius: "6px", marginBottom: "12px", fontSize: "13px" }}>
                  <span>⚠️</span>
                  <span>
                    <strong>Potentially outdated answer.</strong> {ans.outdatedFlags.length} community members have flagged this answer as potentially containing outdated code or practices.
                  </span>
                  {(String(User?.result?._id) === String(ans.userId) || User?.result?.isAdmin) && (
                    <button
                      type="button"
                      onClick={() => handleClearOutdated(ans._id)}
                      className="btn btn-soft"
                      style={{ marginLeft: "auto", fontSize: "11px", padding: "4px 8px", cursor: "pointer" }}
                    >
                      Clear Flags
                    </button>
                  )}
                </div>
              )}

              <div className="display-ans-container-2">
                {/* Left voting column */}
                <div className="question-votes-col-wrapper" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)" }}>
                  <VoteRail
                    score={currentScore}
                    onUpVote={() => handleUpVote(ans._id, ans.userId)}
                    onDownVote={() => handleDownVote(ans._id, ans.userId)}
                    userUpVoted={hasUpvoted}
                    userDownVoted={hasDownvoted}
                    isVoting={votingAnswerId === ans._id}
                    accepted={ans.isAccepted}
                  />

                  {String(User?.result?._id) === String(question.userId) ? (
                    <button
                      type="button"
                      className={`accept-checkmark-btn ${ans.isAccepted ? "accepted" : ""}`}
                      onClick={() => handleAcceptAnswer(ans._id)}
                      title={
                        ans.isAccepted ? "Accepted answer (Click to undo)" : "Accept this answer"
                      }
                      style={{ marginTop: "var(--space-2)" }}
                    >
                      <CheckIcon />
                    </button>
                  ) : (
                    ans.isAccepted && (
                      <div className="accept-checkmark-static-icon accepted" title="Accepted answer" style={{ marginTop: "var(--space-2)" }}>
                        <CheckIcon />
                      </div>
                    )
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
                          placeholder="Type your answer here..."
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
                      {User && editingAnswerId !== ans._id && (
                        <button type="button" onClick={() => handleEditClick(ans)}>
                          Edit
                        </button>
                      )}
                      {User?.result?._id === ans?.userId && (
                        <button
                          type="button"
                          className="text-danger"
                          onClick={() => handleDeleteClick(ans._id)}
                        >
                          Delete
                        </button>
                      )}
                      {User && (
                        <>
                          {User.result._id !== ans.userId && (
                            <button type="button" className="text-muted" onClick={() => setFlagAnswerId(ans._id)}>
                              Flag
                            </button>
                          )}
                          {User.result._id !== ans.userId && (
                            <button type="button" className="text-muted" onClick={() => handleFlagOutdated(ans._id)}>
                              {ans.outdatedFlags?.some((f) => String(f.userId) === String(User?.result?._id))
                                ? "Outdated ✓"
                                : "Mark as Outdated"}
                            </button>
                          )}
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
                          <UserBadge userId={ans.userId} reputation={ans.userReputation} badges={ans.userBadges} />
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
          </React.Fragment>
        );
      })}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Answer"
        message="Are you sure you want to delete this answer? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />

      <FlagModal
        isOpen={flagAnswerId !== null}
        onClose={() => setFlagAnswerId(null)}
        targetType="answer"
        targetId={flagAnswerId}
        questionId={id}
      />
    </div>
  );
};

export default DisplayAnswer;
