import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as api from "../../api";
import "./RightSidebar.css";

const WidgetRelatedQuestions = ({ questionId }) => {
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        setLoading(true);
        const { data } = await api.getRelatedQuestions(questionId);
        setRelated(data);
      } catch (err) {
        console.error("Error fetching related questions:", err);
      } finally {
        setLoading(false);
      }
    };

    if (questionId) {
      fetchRelated();
    }
  }, [questionId]);

  if (loading) {
    return (
      <div className="widget-card">
        <h3>Related Questions</h3>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Loading...</p>
      </div>
    );
  }

  if (related.length === 0) {
    return null;
  }

  return (
    <div className="widget-card">
      <h3>Related Questions</h3>
      <div className="related-questions-list" style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "8px 0" }}>
        {related.map((q) => {
          const isAnswered = q.acceptedAnswerId || q.noOfAnswers > 0;
          return (
            <div key={q._id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Link
                to={`/Questions/${q._id}`}
                className="question-title-link"
                style={{ fontSize: "14px", fontWeight: "500", textDecoration: "none", color: "var(--color-link)", lineHeight: "1.3" }}
              >
                {q.questionTitle}
              </Link>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--color-text-muted)" }}>
                <span className={`status-chip ${isAnswered ? "status-chip-answered" : "status-chip-unanswered"}`} style={{ padding: "2px 6px", fontSize: "10px", borderRadius: "4px" }}>
                  {q.acceptedAnswerId ? "Accepted" : q.noOfAnswers > 0 ? "Answered" : "Unanswered"}
                </span>
                <span>{q.noOfAnswers || 0} answers</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WidgetRelatedQuestions;
