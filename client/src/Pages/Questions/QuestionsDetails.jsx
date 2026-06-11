import React, { useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { formatDistanceToNow } from "date-fns";
import copy from "copy-to-clipboard";
import ReactQuill from "react-quill";

import upvote from "../../assets/sort-up.svg";
import downvote from "../../assets/sort-down.svg";
import "./Questions.css";
import Avatar from "../../components/Avatar/Avatar";
import DisplayAnswer from "./DisplayAnswer";
import LoadingSkeleton from "../../components/LoadingSkeleton/LoadingSkeleton";
import SafeHtml from "../../components/SafeHtml/SafeHtml";
import Comments from "../../components/Comments/Comments";
import { toggleSaveQuestion } from "../../actions/users";
import {
  postAnswer,
  deleteQuestion,
  voteQuestion,
  updateQuestion,
} from "../../actions/question";

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
    setIsEditing(false);
  };

  const handleUpVote = () => {
    if (User === null) {
      alert("Login or Signup to up vote a question");
      Navigate("/Auth");
    } else {
      dispatch(voteQuestion(id, "upVote"));
    }
  };

  const handleDownVote = () => {
    if (User === null) {
      alert("Login or Signup to down vote a question");
      Navigate("/Auth");
    } else {
      dispatch(voteQuestion(id, "downVote"));
    }
  };

  const handleBookmarkClick = (questionId) => {
    if (User === null) {
      alert("Login or Signup to bookmark a question");
      Navigate("/Auth");
    } else {
      dispatch(toggleSaveQuestion(User.result._id, questionId));
    }
  };

  return (
    <div className="question-details-page">
      {questionsList.data === null ? (
        <LoadingSkeleton type="question-detail" count={1} />
      ) : (
        <>
          {questionsList.data
            .filter((question) => question._id === id)
            .map((question) => (
              <div key={question._id}>
                {isEditing ? (
                  <section className="question-details-container" style={{ padding: "20px", border: "1px solid #d2d2d2", borderRadius: "5px" }}>
                    <h2>Edit Question</h2>
                    <form onSubmit={handleSaveEdit}>
                      <div className="ask-form-container">
                        <label>
                          <h4>Title</h4>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            style={{ width: "100%", padding: "8px", margin: "8px 0", border: "1px solid #ccc", borderRadius: "4px" }}
                          />
                        </label>
                        <label>
                          <h4>Body</h4>
                          <ReactQuill
                            theme="snow"
                            value={editBody}
                            onChange={setEditBody}
                            modules={modules}
                            formats={formats}
                          />
                        </label>
                        <label style={{ display: "block", marginTop: "15px" }}>
                          <h4>Tags (space-separated)</h4>
                          <input
                            type="text"
                            value={editTags}
                            onChange={(e) => setEditTags(e.target.value)}
                            style={{ width: "100%", padding: "8px", margin: "8px 0", border: "1px solid #ccc", borderRadius: "4px" }}
                          />
                        </label>
                        <div style={{ marginTop: "15px" }}>
                          <button type="submit" className="post-ans-btn" style={{ marginRight: "10px", margin: "10px 0" }}>Save</button>
                          <button type="button" onClick={() => setIsEditing(false)} className="edit-question-btn">Cancel</button>
                        </div>
                      </div>
                    </form>
                  </section>
                ) : (
                  <section className="question-details-container">
                    <h1>{question.questionTitle}</h1>
                    <div className="question-header-meta" style={{ display: "flex", flexWrap: "wrap", gap: "15px", fontSize: "13px", color: "#6a737c", borderBottom: "1px solid #e3e6e8", paddingBottom: "8px", marginBottom: "15px" }}>
                      <span>Asked <strong style={{ color: "#232629" }}>{formatDistanceToNow(new Date(question.askedOn), { addSuffix: true })}</strong></span>
                      {question.editedOn && <span>Active <strong style={{ color: "#232629" }}>{formatDistanceToNow(new Date(question.editedOn), { addSuffix: true })}</strong></span>}
                      <span>Viewed <strong style={{ color: "#232629" }}>{question.views || 0} times</strong></span>
                    </div>
                    <div className="question-details-container-2">
                      <div className="question-votes">
                        <img
                          src={upvote}
                          alt=""
                          width="18"
                          className="votes-icon"
                          onClick={handleUpVote}
                        />
                        <p>{question.upVote.length - question.downVote.length}</p>
                        <img
                          src={downvote}
                          alt=""
                          width="18"
                          className="votes-icon"
                          onClick={handleDownVote}
                        />
                        <div
                          className="bookmark-btn"
                          onClick={() => handleBookmarkClick(question._id)}
                          style={{
                            cursor: "pointer",
                            textAlign: "center",
                            marginTop: "12px",
                            fontSize: "22px",
                            color: User?.result?.savedQuestions?.includes(question._id) ? "#f48024" : "#bbc0c4",
                            transition: "color 0.2s"
                          }}
                          title={User?.result?.savedQuestions?.includes(question._id) ? "Remove bookmark" : "Bookmark this question"}
                        >
                          {User?.result?.savedQuestions?.includes(question._id) ? "🔖" : "☆"}
                        </div>
                      </div>
                      <div style={{ width: "100%" }}>
                        <SafeHtml content={question.questionBody} className="question-body" />
                        <div className="question-details-tags">
                          {question.questionTags.map((tag) => (
                            <Link to={`/Tags/${tag}`} key={tag}>
                              {tag}
                            </Link>
                          ))}
                        </div>
                        {question.editedOn && (
                          <div className="edit-time-line" style={{ display: "flex", justifyContent: "flex-end", margin: "10px 0" }}>
                            <p style={{ fontSize: "12px", color: "#6a737c", margin: 0 }}>
                              edited {formatDistanceToNow(new Date(question.editedOn), { addSuffix: true })} by {question.editedBy}
                            </p>
                          </div>
                        )}
                        <div className="question-actions-user">
                          <div>
                            <button type="button" onClick={handleShare}>
                              Share
                            </button>
                            {User?.result?._id === question?.userId && (
                              <>
                                <button type="button" onClick={() => handleEditClick(question)}>
                                  Edit
                                </button>
                                <button type="button" onClick={handleDelete}>
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                          <div>
                            <p>asked {formatDistanceToNow(new Date(question.askedOn), { addSuffix: true })}</p>
                            <Link
                              to={`/Users/${question.userId}`}
                              className="user-link"
                              style={{ color: "#0086d8" }}
                            >
                              <Avatar
                                backgroundColor="orange"
                                px="8px"
                                py="5px"
                                borderRadius="4px"
                              >
                                {question.userPosted.charAt(0).toUpperCase()}
                              </Avatar>
                              <div>{question.userPosted}</div>
                            </Link>
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
                    <h3>{question.noOfAnswers} Answers</h3>
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
                      handlePostAns(e, question.answer.length);
                    }}
                  >
                    <ReactQuill
                      theme="snow"
                      value={Answer}
                      onChange={setAnswer}
                      modules={modules}
                      formats={formats}
                    />
                    <br />
                    <input
                      type="submit"
                      className="post-ans-btn"
                      value="Post Your Answer"
                    />
                  </form>
                  <p>
                    Browse other Question tagged
                    {question.questionTags.map((tag) => (
                      <Link to={`/Tags/${tag}`} key={tag} className="ans-tags">
                        {" "}
                        {tag}{" "}
                      </Link>
                    ))}{" "}
                    or
                    <Link
                      to="/AskQuestion"
                      style={{ textDecoration: "none", color: "#009dff" }}
                    >
                      {" "}
                      ask your own question.
                    </Link>
                  </p>
                </section>
              </div>
            ))}
        </>
      )}
    </div>
  );
};

export default QuestionsDetails;
