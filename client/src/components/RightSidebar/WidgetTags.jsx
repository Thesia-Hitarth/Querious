import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const WidgetTags = () => {
  const navigate = useNavigate();
  const questionsList = useSelector((state) => state.questionsReducer);
  const questions = questionsList?.data || [];

  // Calculate tag counts dynamically from loaded questions list
  const tagCounts = {};
  questions.forEach((q) => {
    q.questionTags?.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const popularTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Fallback default tags if no questions have been loaded yet
  const displayTags = popularTags.length > 0 
    ? popularTags 
    : [
        { tag: "javascript", count: 0 },
        { tag: "reactjs", count: 0 },
        { tag: "node.js", count: 0 },
        { tag: "python", count: 0 },
        { tag: "html", count: 0 },
        { tag: "css", count: 0 },
        { tag: "mongodb", count: 0 },
        { tag: "express", count: 0 },
        { tag: "java", count: 0 },
        { tag: "c", count: 0 }
      ];

  return (
    <div className="widget-card">
      <h3>Popular Tags</h3>
      <div className="popular-tags-list">
        {displayTags.map((tagObj) => (
          <button
            key={tagObj.tag}
            type="button"
            className="tag-chip popular-tag-btn"
            onClick={() => navigate(`/Tags/${tagObj.tag}`)}
          >
            <span className="popular-tag-name">#{tagObj.tag}</span>
            {tagObj.count > 0 && <span className="popular-tag-count">{tagObj.count}</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WidgetTags;
