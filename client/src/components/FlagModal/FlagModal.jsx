import React, { useState, useEffect, useRef } from "react";
import * as api from "../../api";
import { useToast } from "../Toast/ToastContext";
import "./FlagModal.css";

const FlagModal = ({ isOpen, onClose, targetType, targetId, questionId }) => {
  const [reason, setReason] = useState("spam");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      modalRef.current?.querySelector(".modal-cancel-btn")?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.submitFlag({
        targetType,
        targetId,
        questionId,
        reason,
        note,
      });
      showToast("Content reported successfully.", "success");
      onClose();
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        showToast("You have already flagged this content.", "warning");
      } else {
        showToast(err.response?.data?.message || "Failed to submit report.", "danger");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target.className === "modal-overlay" && onClose()}
    >
      <div className="modal-content-card" ref={modalRef} role="dialog" aria-modal="true">
        <h3 className="modal-title">Flag Content</h3>
        <p className="modal-message">
          Why are you reporting this {targetType}? We will review it shortly.
        </p>

        <form onSubmit={handleSubmit} className="flag-form">
          <div className="flag-options">
            <label className="flag-option-label">
              <input
                type="radio"
                name="reason"
                value="spam"
                checked={reason === "spam"}
                onChange={() => setReason("spam")}
              />
              <span className="flag-option-text">
                <strong>Spam</strong> — commercial advertising or self-promotion
              </span>
            </label>

            <label className="flag-option-label">
              <input
                type="radio"
                name="reason"
                value="offensive"
                checked={reason === "offensive"}
                onChange={() => setReason("offensive")}
              />
              <span className="flag-option-text">
                <strong>Offensive</strong> — rude, abusive, hateful, or harassing content
              </span>
            </label>

            <label className="flag-option-label">
              <input
                type="radio"
                name="reason"
                value="duplicate"
                checked={reason === "duplicate"}
                onChange={() => setReason("duplicate")}
              />
              <span className="flag-option-text">
                <strong>Duplicate</strong> — this has already been asked or answered
              </span>
            </label>

            <label className="flag-option-label">
              <input
                type="radio"
                name="reason"
                value="misleading"
                checked={reason === "misleading"}
                onChange={() => setReason("misleading")}
              />
              <span className="flag-option-text">
                <strong>Misleading</strong> — false, incorrect, or heavily outdated info
              </span>
            </label>

            <label className="flag-option-label">
              <input
                type="radio"
                name="reason"
                value="other"
                checked={reason === "other"}
                onChange={() => setReason("other")}
              />
              <span className="flag-option-text">
                <strong>Other</strong> — something else (describe below)
              </span>
            </label>
          </div>

          <textarea
            placeholder="Add any additional context (optional, max 500 chars)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            className="flag-note-input"
            required={reason === "other"}
            rows={3}
          />

          <div className="modal-actions-row">
            <button
              type="button"
              className="modal-btn modal-cancel-btn"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn modal-confirm-btn flag-submit-btn"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Flag Content"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FlagModal;
