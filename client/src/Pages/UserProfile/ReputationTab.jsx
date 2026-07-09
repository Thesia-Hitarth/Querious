import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as api from "../../api";
import { format } from "date-fns";

const ReputationTab = ({ userId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReputation = async () => {
      try {
        setLoading(true);
        const { data } = await api.getUserReputation(userId);
        setHistory(data);
      } catch (err) {
        console.error("Error fetching reputation history:", err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) {
      fetchReputation();
    }
  }, [userId]);

  if (loading) {
    return <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>Loading reputation history...</p>;
  }

  if (history.length === 0) {
    return (
      <div style={{ padding: "var(--space-6)", textAlign: "center", border: "1px dashed var(--color-border-light)", borderRadius: "8px" }}>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>No reputation events recorded yet.</p>
      </div>
    );
  }

  const getActionLabel = (action) => {
    switch (action) {
      case "vote_received":
        return "Received vote on post";
      case "answer_accepted":
        return "Answer was accepted";
      case "accepted_answer_bonus":
        return "Accepted an answer to own question";
      case "suggested_edit_approved":
        return "Suggested edit was approved";
      case "acceptance_reversed":
        return "Accepted answer status unselected";
      default:
        return "Reputation adjustment";
    }
  };

  return (
    <div style={{ padding: "16px 0", maxWidth: "650px" }}>
      <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", color: "var(--color-text-primary)" }}>
        Reputation History
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {history.map((event) => {
          const isPositive = event.repDelta > 0;
          const isNegative = event.repDelta < 0;
          const isCapped = event.originalDelta > 0 && event.repDelta < event.originalDelta;

          return (
            <div
              key={event._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "12px 16px",
                borderRadius: "6px",
                border: "1px solid var(--color-border-light)",
                backgroundColor: "var(--color-bg-card, #161b22)"
              }}
            >
              {/* Reputation Delta badge */}
              <span
                style={{
                  display: "inline-block",
                  width: "50px",
                  textAlign: "center",
                  fontSize: "14px",
                  fontWeight: "bold",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  color: isPositive ? "#2da44e" : isNegative ? "#cf222e" : "var(--color-text-muted)",
                  backgroundColor: isPositive ? "rgba(45,164,78,0.1)" : isNegative ? "rgba(207,34,46,0.1)" : "rgba(255,255,255,0.05)"
                }}
              >
                {isPositive ? `+${event.repDelta}` : event.repDelta}
              </span>

              {/* Event Description */}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "14px", fontWeight: "500", color: "var(--color-text-primary)" }}>
                  {getActionLabel(event.action)}
                </span>
                {isCapped && (
                  <span
                    style={{
                      fontSize: "10px",
                      marginLeft: "8px",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      backgroundColor: "rgba(244,130,37,0.15)",
                      color: "var(--color-brand-primary)",
                      fontWeight: "bold"
                    }}
                    title={`Earned ${event.repDelta} of ${event.originalDelta} due to daily 200 reputation cap.`}
                  >
                    CAPPED
                  </span>
                )}
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                  {format(new Date(event.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                </div>
              </div>

              {/* View Source Link */}
              {event.sourceId && (
                <Link
                  to={`/Questions/${event.sourceId}`}
                  style={{ fontSize: "12px", color: "var(--color-link)", textDecoration: "underline" }}
                >
                  View Post
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReputationTab;
