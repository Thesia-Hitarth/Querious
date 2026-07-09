import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import "./Comments.css";
import {
  commentQuestion,
  deleteCommentQuestion,
  commentAnswer,
  deleteCommentAnswer,
} from "../../actions/question";
import { useToast } from "../Toast/ToastContext";
import ConfirmationModal from "../ConfirmationModal/ConfirmationModal";
import * as api from "../../api";

const Comments = ({ questionId, parentId, comments = [], type, postOwnerId }) => {
  const dispatch = useDispatch();
  const User = useSelector((state) => state.currentUserReducer);
  const { showToast } = useToast();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  // Track which comment is pending deletion so we can show the confirmation modal
  const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState(null);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const handleInputChange = async (e) => {
    const val = e.target.value;
    setCommentText(val);

    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, selectionStart);
    const lastWord = textBeforeCursor.split(/[\s,]+/).pop() || "";

    if (lastWord.startsWith("@")) {
      const searchStr = lastWord.slice(1);
      try {
        const { data } = await api.getAllUsers({ page: 1, limit: 5, search: searchStr });
        setSuggestions(data.data || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
      }
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (userName) => {
    const val = commentText;
    const inputEl = document.getElementById(`comment-input-${parentId}`);
    const selectionStart = inputEl ? inputEl.selectionStart : val.length;
    const textBeforeCursor = val.slice(0, selectionStart);
    const textAfterCursor = val.slice(selectionStart);
    
    const words = textBeforeCursor.split(/([\s,]+)/);
    const formattedName = userName.replace(/\s+/g, "");
    words[words.length - 1] = `@${formattedName} `;
    
    const newText = words.join("") + textAfterCursor;
    setCommentText(newText);
    setShowSuggestions(false);
    setSuggestions([]);
    
    setTimeout(() => {
      inputEl?.focus();
      const newCursorPos = words.join("").length;
      inputEl?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const displayedComments = isExpanded ? comments : comments.slice(0, 5);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (User === null) {
      showToast("Please login to comment", "warning");
      return;
    }
    if (!commentText.trim()) {
      showToast("Comment cannot be empty", "error");
      return;
    }
    if (commentText.length > 600) {
      showToast("Comment cannot exceed 600 characters", "error");
      return;
    }

    try {
      if (type === "question") {
        await dispatch(commentQuestion(parentId, commentText));
      } else {
        await dispatch(commentAnswer(questionId, parentId, commentText));
      }
      setCommentText("");
      setShowInput(false);
    } catch (err) {
      showToast("Failed to add comment. Please try again.", "error");
    }
  };

  // Opens the confirmation modal instead of deleting immediately.
  const handleDeleteComment = (commentId) => {
    setPendingDeleteCommentId(commentId);
  };

  // Called when the user confirms deletion in the modal.
  const confirmDeleteComment = () => {
    if (!pendingDeleteCommentId) return;
    if (type === "question") {
      dispatch(deleteCommentQuestion(parentId, pendingDeleteCommentId));
    } else {
      dispatch(deleteCommentAnswer(questionId, parentId, pendingDeleteCommentId));
    }
    setPendingDeleteCommentId(null);
  };

  return (
    <div className="comments-container">
      {comments.length > 0 && (
        <div className="comments-list">
          {displayedComments.map((comment) => (
            <div key={comment._id} className="comment-item">
              <span className="comment-text">
                {comment.commentBody}
                <Link to={`/Users/${comment.userId}`} className="comment-author">
                  – {comment.userCommented}
                </Link>
                <span className="comment-date">
                  {comment.commentedOn &&
                    formatDistanceToNow(new Date(comment.commentedOn), {
                      addSuffix: true,
                    })}
                </span>
              </span>
              {(User?.result?._id === comment.userId ||
                User?.result?._id === postOwnerId) && (
                <button
                  type="button"
                  className="delete-comment-btn"
                  onClick={() => handleDeleteComment(comment._id)}
                  title="Delete comment"
                  aria-label="Delete comment"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {comments.length > 5 && !isExpanded && (
        <button
          type="button"
          className="show-more-comments-btn"
          onClick={() => setIsExpanded(true)}
        >
          Show {comments.length - 5} more comments
        </button>
      )}

      {showInput ? (
        <form onSubmit={handleAddComment} className="add-comment-form" style={{ position: "relative" }}>
          <input
            id={`comment-input-${parentId}`}
            type="text"
            className="add-comment-input"
            placeholder="Add a comment... (use @username to mention)"
            value={commentText}
            onChange={handleInputChange}
            autoFocus
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="mention-suggestions-dropdown" style={{ position: "absolute", zIndex: 100, backgroundColor: "var(--color-bg-card, #161b22)", border: "1px solid var(--color-border-light)", borderRadius: "6px", width: "250px", maxHeight: "160px", overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", marginTop: "36px" }}>
              {suggestions.map((user) => (
                <div
                  key={user._id}
                  className="mention-suggestion-item"
                  style={{ padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  onClick={() => handleSelectSuggestion(user.name)}
                >
                  <span className="user-reputation" style={{ fontSize: "10px", padding: "1px 4px", borderRadius: "3px", backgroundColor: "rgba(255,255,255,0.1)" }}>
                    {user.reputation || 1}
                  </span>
                  <span style={{ fontSize: "13px", color: "var(--color-text-primary)" }}>{user.name}</span>
                </div>
              ))}
            </div>
          )}
          <button type="submit" className="add-comment-btn" style={{ marginLeft: "6px" }}>
            Add Comment
          </button>
          <button
            type="button"
            className="show-more-comments-btn"
            style={{ marginLeft: "8px", display: "inline" }}
            onClick={() => setShowInput(false)}
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          className="add-comment-link"
          onClick={() => setShowInput(true)}
        >
          Add a comment
        </button>
      )}

      {/* Confirmation modal for comment deletion — prevents accidental irreversible deletes */}
      <ConfirmationModal
        isOpen={pendingDeleteCommentId !== null}
        onClose={() => setPendingDeleteCommentId(null)}
        onConfirm={confirmDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Comments;
