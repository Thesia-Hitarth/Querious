import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import ReactQuill from "react-quill";

import Avatar from "../../components/Avatar/Avatar";
import { deleteAnswer, voteAnswer, acceptAnswer, updateAnswer } from "../../actions/question";
import SafeHtml from "../../components/SafeHtml/SafeHtml";
import upvote from "../../assets/sort-up.svg";
import downvote from "../../assets/sort-down.svg";
import Comments from "../../components/Comments/Comments";

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
    setEditingAnswerId(null);
  };

  const handleDelete = (answerId) => {
    dispatch(deleteAnswer(id, answerId));
  };

  const handleUpVote = (answerId) => {
    if (User === null) {
      alert("Login or Signup to vote an answer");
    } else {
      dispatch(voteAnswer(id, answerId, "upVote"));
    }
  };

  const handleDownVote = (answerId) => {
    if (User === null) {
      alert("Login or Signup to vote an answer");
    } else {
      dispatch(voteAnswer(id, answerId, "downVote"));
    }
  };

  const handleAcceptAnswer = (answerId) => {
    if (User === null) {
      alert("Login or Signup to accept an answer");
    } else {
      dispatch(acceptAnswer(id, answerId));
    }
  };

  return (
    <div>
      {question.answer.map((ans) => (
        <div
          className={`display-ans ${ans.isAccepted ? "accepted-answer" : ""}`}
          key={ans._id}
        >
          <div className="display-ans-container-2">
            <div className="question-votes">
              <img
                src={upvote}
                alt="upvote"
                width="18"
                className="votes-icon"
                onClick={() => handleUpVote(ans._id)}
              />
              <p>{ans.upVote.length - ans.downVote.length}</p>
              <img
                src={downvote}
                alt="downvote"
                width="18"
                className="votes-icon"
                onClick={() => handleDownVote(ans._id)}
              />
              {(String(User?.result?._id) === String(question.userId) ||
                ans.isAccepted) && (
                <button
                  type="button"
                  className={`accept-checkmark-btn ${
                    ans.isAccepted ? "accepted" : ""
                  }`}
                  onClick={() => handleAcceptAnswer(ans._id)}
                  disabled={String(User?.result?._id) !== String(question.userId)}
                  title={
                    ans.isAccepted ? "Accepted answer" : "Accept this answer"
                  }
                >
                  ✓
                </button>
              )}
            </div>
            <div style={{ width: "100%" }}>
              {editingAnswerId === ans._id ? (
                <form onSubmit={(e) => handleSaveEdit(e, ans._id)}>
                  <ReactQuill
                    theme="snow"
                    value={editAnswerBody}
                    onChange={setEditAnswerBody}
                    modules={modules}
                    formats={formats}
                  />
                  <div style={{ marginTop: "10px", marginBottom: "15px" }}>
                    <button type="submit" className="post-ans-btn" style={{ marginRight: "10px", margin: "10px 0" }}>Save</button>
                    <button type="button" onClick={() => setEditingAnswerId(null)} className="edit-question-btn">Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <SafeHtml content={ans.answerBody} />
                  {ans.editedOn && (
                    <div className="edit-time-line" style={{ display: "flex", justifyContent: "flex-end", margin: "5px 0" }}>
                      <p style={{ fontSize: "12px", color: "#6a737c", margin: 0 }}>
                        edited {formatDistanceToNow(new Date(ans.editedOn), { addSuffix: true })}
                      </p>
                    </div>
                  )}
                </>
              )}
              <div className="question-actions-user">
                <div>
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
                        onClick={() => handleDelete(ans._id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
                <div>
                  <p>answered {formatDistanceToNow(new Date(ans.answeredOn), { addSuffix: true })}</p>
                  <Link
                    to={`/Users/${ans.userId}`}
                    className="user-link"
                    style={{ color: "#0086d8" }}
                  >
                    <Avatar
                      backgroundColor="lightgreen"
                      px="8px"
                      py="5px"
                      borderRadius="4px"
                    >
                      {ans.userAnswered.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>{ans.userAnswered}</div>
                  </Link>
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
      ))}
    </div>
  );
};

export default DisplayAnswer;
