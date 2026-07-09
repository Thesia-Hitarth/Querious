import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import * as api from "../../api";
import { useToast } from "../../components/Toast/ToastContext";
import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";
import SafeHtml from "../../components/SafeHtml/SafeHtml";

const ReviewQueue = ({ slideIn, handleSlideIn }) => {
  const User = useSelector((state) => state.currentUserReducer);
  const { showToast } = useToast();

  const [edits, setEdits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectionEditId, setRejectionEditId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const hasPrivilege = User?.result?.isAdmin || (User?.result?.reputation || 0) >= 2000;

  const fetchEdits = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.getSuggestedEdits();
      setEdits(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch suggested edits.", "danger");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (hasPrivilege) {
      fetchEdits();
    } else {
      setLoading(false);
    }
  }, [User, fetchEdits, hasPrivilege]);

  const handleApprove = async (id) => {
    try {
      await api.approveSuggestedEdit(id);
      showToast("Suggested edit approved successfully!", "success");
      fetchEdits();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to approve edit.", "danger");
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason.trim()) {
      showToast("Please provide a rejection reason.", "warning");
      return;
    }
    try {
      await api.rejectSuggestedEdit(id, rejectionReason);
      showToast("Suggested edit rejected.", "success");
      setRejectionEditId(null);
      setRejectionReason("");
      fetchEdits();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to reject edit.", "danger");
    }
  };

  if (!User) {
    return (
      <div className="home-container-1">
        <LeftSidebar slideIn={slideIn} handleSlideIn={handleSlideIn} />
        <div className="home-container-2" style={{ padding: "var(--space-6)" }}>
          <p>Please login to access the Review Queue.</p>
        </div>
      </div>
    );
  }

  if (!hasPrivilege) {
    return (
      <div className="home-container-1">
        <LeftSidebar slideIn={slideIn} handleSlideIn={handleSlideIn} />
        <div className="home-container-2" style={{ padding: "var(--space-6)", textAlign: "center" }}>
          <h2 style={{ color: "var(--color-text-primary)" }}>Access Denied</h2>
          <p style={{ color: "var(--color-text-muted)", marginTop: "12px" }}>
            You need 2,000+ reputation or administrator status to access the suggested edits review queue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container-1">
      <LeftSidebar slideIn={slideIn} handleSlideIn={handleSlideIn} />
      <div className="home-container-2" style={{ padding: "var(--space-6)", color: "var(--color-text-primary)" }}>
        <h2 style={{ marginBottom: "var(--space-4)" }}>Suggested Edits Review Queue</h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-6)" }}>
          Review suggested edits from the community. Approve edits to apply them and award the author +2 reputation.
        </p>

        {loading ? (
          <p>Loading pending suggestions...</p>
        ) : edits.length === 0 ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", border: "1px dashed var(--color-border-light)", borderRadius: "8px" }}>
            <p style={{ color: "var(--color-text-muted)" }}>All caught up! No suggested edits pending review.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {edits.map((edit) => (
              <div
                key={edit._id}
                style={{
                  border: "1px solid var(--color-border-light)",
                  borderRadius: "8px",
                  padding: "20px",
                  backgroundColor: "var(--color-bg-card, #161b22)",
                }}
              >
                {/* Meta details */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px", marginBottom: "16px" }}>
                  <div>
                    <span style={{ fontWeight: "600", fontSize: "14px" }}>
                      Suggested Edit for {edit.targetType}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)", marginLeft: "12px" }}>
                      Target ID: {edit.targetId}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px" }}>
                    Suggested by:{" "}
                    <strong style={{ color: "var(--color-brand-primary)" }}>
                      {edit.suggestedBy?.name || "Anonymous"}
                    </strong>{" "}
                    ({edit.suggestedBy?.reputation || 1} rep)
                  </div>
                </div>

                {/* Diff/Proposed Content */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
                  {edit.title && (
                    <div>
                      <h5 style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "4px" }}>Proposed Title</h5>
                      <p style={{ fontSize: "15px", fontWeight: "600" }}>{edit.title}</p>
                    </div>
                  )}
                  {edit.tags && edit.tags.length > 0 && (
                    <div>
                      <h5 style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "4px" }}>Proposed Tags</h5>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {edit.tags.map((t) => (
                          <span key={t} className="tag-chip" style={{ fontSize: "11px" }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <h5 style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "4px" }}>Proposed Body</h5>
                    <div className="prose" style={{ padding: "12px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", backgroundColor: "rgba(0,0,0,0.1)" }}>
                      <SafeHtml content={edit.body} />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => handleApprove(edit._id)}
                    className="btn btn-primary"
                    style={{ backgroundColor: "#2da44e", color: "white", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", border: "none", fontWeight: "600" }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectionEditId(rejectionEditId === edit._id ? null : edit._id)}
                    className="btn btn-ghost"
                    style={{ color: "#cf222e", border: "1px solid #cf222e", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                  >
                    Reject...
                  </button>

                  <Link
                    to={edit.targetType === "question" ? `/Questions/${edit.targetId}` : `/Questions`}
                    style={{ marginLeft: "auto", fontSize: "13px", color: "var(--color-link)", textDecoration: "underline" }}
                  >
                    View Original Post
                  </Link>
                </div>

                {/* Rejection input box */}
                {rejectionEditId === edit._id && (
                  <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600" }}>Reason for rejection</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this suggestion was rejected..."
                      rows={2}
                      style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--color-border-light)", backgroundColor: "#0d1117", color: "white", outline: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => handleReject(edit._id)}
                      className="btn"
                      style={{ alignSelf: "flex-start", backgroundColor: "#cf222e", color: "white", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", border: "none", fontSize: "13px" }}
                    >
                      Confirm Rejection
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewQueue;
