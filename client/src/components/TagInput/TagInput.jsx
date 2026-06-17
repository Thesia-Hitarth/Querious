import React, { useState, useEffect } from "react";
import "./TagInput.css";
import { useToast } from "../Toast/ToastContext";

const TagInput = ({ tags = [], onChange, placeholder = "Add tags..." }) => {
  const [internalTags, setInternalTags] = useState(tags);
  const [inputVal, setInputVal] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    setInternalTags(tags);
  }, [tags]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !inputVal && internalTags.length > 0) {
      removeTag(internalTags.length - 1);
    }
  };

  const addTag = () => {
    const trimmed = inputVal.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""); // strip invalid characters
    if (!trimmed) {
      setInputVal("");
      return;
    }
    if (internalTags.includes(trimmed)) {
      showToast(`Tag "${trimmed}" has already been added`, "warning");
      setInputVal("");
      return;
    }
    if (internalTags.length >= 5) {
      showToast("You can add up to 5 tags only", "warning");
      setInputVal("");
      return;
    }
    if (trimmed.length > 50) {
      showToast("Each tag cannot exceed 50 characters", "warning");
      return;
    }
    const newTags = [...internalTags, trimmed];
    setInternalTags(newTags);
    onChange(newTags);
    setInputVal("");
  };

  const removeTag = (indexToRemove) => {
    const newTags = internalTags.filter((_, idx) => idx !== indexToRemove);
    setInternalTags(newTags);
    onChange(newTags);
  };

  return (
    <div className="tag-input-container">
      <div className="tag-chips-wrapper">
        {internalTags.map((tag, idx) => (
          <span key={idx} className="tag-pill">
            {tag}
            <button
              type="button"
              className="tag-pill-remove-btn"
              onClick={() => removeTag(idx)}
              aria-label={`Remove tag ${tag}`}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          className="tag-pill-input"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag} // add tag when focus leaves input
          placeholder={internalTags.length === 0 ? placeholder : (internalTags.length >= 5 ? "Maximum tags reached" : "")}
          disabled={internalTags.length >= 5}
          aria-label="Tags input"
        />
      </div>
      <div className="tag-input-footer">
        <span className={`tag-input-counter ${internalTags.length >= 5 ? "limit-reached" : ""}`}>{internalTags.length}/5 tags</span>
      </div>
    </div>
  );
};

export default TagInput;
