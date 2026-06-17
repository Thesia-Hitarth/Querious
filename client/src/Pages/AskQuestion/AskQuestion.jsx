import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";

import "./AskQuestion.css";
import { askQuestion } from "../../actions/question";
import { useToast } from "../../components/Toast/ToastContext";
import TagInput from "../../components/TagInput/TagInput";

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

const AskQuestion = () => {
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionBody, setQuestionBody] = useState("");
  const [questionTags, setQuestionTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();
  const User = useSelector((state) => state.currentUserReducer);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [similarQuestions, setSimilarQuestions] = useState([]);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setQuestionTitle(val);
    if (val.trim().length < 3) {
      setSimilarQuestions([]);
    }
  };

  useEffect(() => {
    if (questionTitle.trim().length < 3) {
      setSimilarQuestions([]);
      return;
    }

    // M-03: Use AbortController so a slow earlier request cannot overwrite
    // the results of a faster later one when the user types quickly.
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const apiModule = await import("../../api");
        const { data } = await apiModule.getAllQuestions(
          { search: questionTitle.trim(), limit: 5, page: 1 },
          { signal: controller.signal }
        );
        setSimilarQuestions(data?.data || []);
      } catch (err) {
        // Ignore abort errors — they are expected on cleanup
        if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
          setSimilarQuestions([]);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [questionTitle]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (User) {
      if (questionTitle && questionBody && questionTags.length > 0) {
        if (questionTitle.length > 300) {
          showToast("Title cannot exceed 300 characters", "error");
          return;
        }
        const visibleBodyLength = questionBody.replace(/<[^>]+>/g, "").length;
        if (visibleBodyLength > 30000) {
          showToast("Body cannot exceed 30,000 characters", "error");
          return;
        }
        // C-01: Guard against double-submission on slow connections
        setIsSubmitting(true);
        try {
          await dispatch(
            askQuestion(
              {
                questionTitle,
                questionBody,
                questionTags,
                userPosted: User.result.name,
              },
              navigate
            )
          );
          showToast("Question posted successfully!", "success");
        } catch (error) {
          showToast(error.response?.data?.message || "Failed to post question. Please try again.", "error");
        } finally {
          setIsSubmitting(false);
        }
      } else {
        if (!questionTitle) showToast("Please specify a question title", "error");
        else if (!questionBody) showToast("Please write a question body", "error");
        else if (questionTags.length === 0) showToast("Please add at least one tag", "error");
      }
    } else showToast("Please login to ask a question", "warning");
  };

  return (
    <div className="ask-question">
      <div className="ask-ques-container">
        <h1 className="ask-ques-heading">Ask a public question</h1>

        <div className="ask-layout-grid">
          {/* Left Column: The Form */}
          <div className="ask-form-column">
            <form onSubmit={handleSubmit} className="ask-form">
              <div className="ask-form-container">
                <div className="form-group">
                  <label htmlFor="ask-ques-title">Title</label>
                  <span className="field-hint">Be specific and imagine you're asking a question to another person</span>
                  <input
                    type="text"
                    id="ask-ques-title"
                    onChange={handleTitleChange}
                    placeholder="e.g. Is there an R function for finding the index of an element in a vector?"
                    maxLength={300}
                    required
                  />
                  {/* U-03: Live character counter so users know before they hit the limit */}
                  <span
                    className="char-counter"
                    style={{
                      fontSize: "12px",
                      color: questionTitle.length >= 280 ? "var(--color-error, #e54545)" : "var(--color-text-muted)",
                      display: "block",
                      textAlign: "right",
                      marginTop: "4px",
                    }}
                  >
                    {questionTitle.length}/300
                  </span>
                  {similarQuestions.length > 0 && (
                    <div className="similar-questions-panel">
                      <span className="panel-title">💡 Similar questions already asked:</span>
                      <ul className="similar-questions-list">
                        {similarQuestions.map((sq) => (
                          <li key={sq._id} className="similar-question-item">
                            <a href={`/Questions/${sq._id}`} target="_blank" rel="noreferrer" className="similar-question-link">
                              {sq.questionTitle}
                            </a>
                            <span className="similar-question-meta">({sq.noOfAnswers || 0} answers)</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="ask-ques-body">Body</label>
                  <span className="field-hint">Include all the information someone would need to answer your question</span>
                  <div className="editor-wrapper">
                    <ReactQuill
                      theme="snow"
                      value={questionBody}
                      onChange={setQuestionBody}
                      modules={modules}
                      formats={formats}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="ask-ques-tags">Tags</label>
                  <span className="field-hint">Add up to 5 tags to describe what your question is about</span>
                  <TagInput
                    tags={questionTags}
                    onChange={setQuestionTags}
                    placeholder="e.g. (reactjs quill javascript)"
                  />
                </div>
              </div>

              <div className="ask-form-actions">
                {/* C-01: Disable button while submitting to prevent double-post */}
                <input
                  type="submit"
                  value={isSubmitting ? "Posting…" : "Post your question"}
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  aria-disabled={isSubmitting}
                />
              </div>
            </form>
          </div>

          {/* Right Column: Tips Sidebar */}
          <div className="ask-tips-sidebar">
            <h3 className="tips-heading">Writing a good question</h3>
            <p className="tips-intro">You’re ready to ask a programming-related question and this guide will help you through the process.</p>
            <ul className="tips-list">
              <li>Summarize your problem in a one-line title.</li>
              <li>Describe your problem in more detail.</li>
              <li>Describe what you tried and what you expected to happen.</li>
              <li>Add "tags" which help connect your question with members of the community.</li>
              <li>Review your question and post it to the community.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AskQuestion;
