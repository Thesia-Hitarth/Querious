import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useSelector, useDispatch } from "react-redux";
import { toggleSaveQuestion } from "../../actions/users";

const Questions = ({ question }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const User = useSelector((state) => state.currentUserReducer);

  const handleBookmarkClick = (e, questionId) => {
    e.preventDefault();
    if (User === null) {
      alert("Login or Signup to bookmark a question");
      navigate("/Auth");
    } else {
      dispatch(toggleSaveQuestion(User.result._id, questionId));
    }
  };

  return (
    <div className="display-question-container">
      <div className="display-votes-ans">
        <p>{question.upVote.length - question.downVote.length}</p>
        <p>votes</p>
      </div>
      <div className="display-votes-ans">
        <p>{question.noOfAnswers}</p>
        <p>answers</p>
      </div>
      <div className="display-question-details">
        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            onClick={(e) => handleBookmarkClick(e, question._id)}
            style={{
              cursor: "pointer",
              marginRight: "8px",
              fontSize: "18px",
              color: User?.result?.savedQuestions?.includes(question._id) ? "#f48024" : "#bbc0c4",
              transition: "color 0.2s"
            }}
            title={User?.result?.savedQuestions?.includes(question._id) ? "Remove bookmark" : "Bookmark this question"}
          >
            {User?.result?.savedQuestions?.includes(question._id) ? "🔖" : "☆"}
          </span>
          <Link to={`/Questions/${question._id}`} className="question-title-link">
            {question.questionTitle.length > (window.innerWidth <= 400 ? 70 : 90)
              ? question.questionTitle.substring(
                  0,
                  window.innerWidth <= 400 ? 70 : 90
                ) + "..."
              : question.questionTitle}
          </Link>
        </div>
        <div className="display-tags-time">
          <div className="display-tags">
            {question.questionTags.map((tag) => (
              <Link to={`/Tags/${tag}`} key={tag}>
                {tag}
              </Link>
            ))}
          </div>
          <p className="display-time">
            asked {formatDistanceToNow(new Date(question.askedOn), { addSuffix: true })} {question.userPosted}
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Questions);
