import React, { useState } from "react";
import "./TagInput.css";
import { useToast } from "../Toast/ToastContext";

const TagInput = ({ tags = [], onChange, placeholder = "Add tags..." }) => {
  const [inputVal, setInputVal] = useState("");
  const { showToast } = useToast();

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !inputVal && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = () => {
    const trimmed = inputVal.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""); // strip invalid characters
    if (!trimmed) {
      setInputVal("");
      return;
    }
    if (tags.includes(trimmed)) {
      showToast(`Tag "${trimmed}" has already been added`, "warning");
      setInputVal("");
      return;
    }
    if (tags.length >= 5) {
      showToast("You can add up to 5 tags only", "warning");
      setInputVal("");
      return;
    }
    if (trimmed.length > 50) {
      showToast("Each tag cannot exceed 50 characters", "warning");
      return;
    }
    onChange([...tags, trimmed]);
    setInputVal("");
  };

  const removeTag = (indexToRemove) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="tag-input-container">
      <div className="tag-chips-wrapper">
        {tags.map((tag, idx) => (
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
        {tags.length < 5 && (
          <input
            type="text"
            className="tag-pill-input"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addTag} // add tag when focus leaves input
            placeholder={tags.length === 0 ? placeholder : ""}
            aria-label="Tags input"
          />
        )}
      </div>
      <div className="tag-input-footer">
        <span className="tag-input-counter">{tags.length}/5 tags</span>
      </div>
    </div>
  );
};

export default TagInput;
