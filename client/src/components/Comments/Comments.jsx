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

const Comments = ({ questionId, parentId, comments = [], type, postOwnerId }) => {
  const dispatch = useDispatch();
  const User = useSelector((state) => state.currentUserReducer);
  const { showToast } = useToast();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [commentText, setCommentText] = useState("");

  const displayedComments = isExpanded ? comments : comments.slice(0, 5);

  const handleAddComment = (e) => {
    e.preventDefault();
    if (User === null) {
      showToast("Please login to comment", "warning");
      return;
    }
    if (!commentText.trim()) {
      showToast("Comment cannot be empty", "error");
      return;
    }

    if (type === "question") {
      dispatch(commentQuestion(parentId, commentText));
    } else {
      dispatch(commentAnswer(questionId, parentId, commentText));
    }

    setCommentText("");
    setShowInput(false);
  };

  const handleDeleteComment = (commentId) => {
    if (type === "question") {
      dispatch(deleteCommentQuestion(parentId, commentId));
    } else {
      dispatch(deleteCommentAnswer(questionId, parentId, commentId));
    }
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
        <form onSubmit={handleAddComment} className="add-comment-form">
          <input
            type="text"
            className="add-comment-input"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            autoFocus
          />
          <button type="submit" className="add-comment-btn">
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
    </div>
  );
};

export default Comments;
