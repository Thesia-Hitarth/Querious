import React, { useState, useEffect } from "react";
import * as api from "../../api";
import { useToast } from "../../components/Toast/ToastContext";

const SettingsTab = ({ userId }) => {
  const [preferences, setPreferences] = useState({
    instant: true,
    digest: "none",
    categories: ["answer", "comment", "vote", "accept", "badge"]
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        setLoading(true);
        const { data } = await api.getUserDetails(userId);
        if (data?.notificationPreferences) {
          setPreferences(data.notificationPreferences);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) {
      fetchPrefs();
    }
  }, [userId]);

  const handleCategoryToggle = (category) => {
    setPreferences((prev) => {
      const exists = prev.categories.includes(category);
      const newCategories = exists
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories: newCategories };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile(userId, { notificationPreferences: preferences });
      showToast("Notification preferences updated successfully.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save preferences.", "danger");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>Loading preferences...</p>;
  }

  return (
    <div style={{ maxWidth: "500px", padding: "16px 0" }}>
      <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", color: "var(--color-text-primary)" }}>
        Notification Settings
      </h3>
      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Instant Notification Toggle */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px", color: "var(--color-text-primary)" }}>
            <input
              type="checkbox"
              checked={preferences.instant}
              onChange={(e) => setPreferences({ ...preferences, instant: e.target.checked })}
              style={{ width: "16px", height: "16px", accentColor: "var(--color-brand-primary, #f48225)" }}
            />
            Receive Instant Notifications
          </label>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)", marginLeft: "26px" }}>
            Enable to receive immediate updates in your browser app when someone answers or comments on your posts.
          </span>
        </div>

        {/* Email Digest Preferences */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontWeight: "600", fontSize: "14px", color: "var(--color-text-primary)" }}>
            Email Digest Frequency
          </label>
          <select
            value={preferences.digest}
            onChange={(e) => setPreferences({ ...preferences, digest: e.target.value })}
            style={{
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid var(--color-border-light)",
              backgroundColor: "var(--color-bg-card, #161b22)",
              color: "var(--color-text-primary)",
              outline: "none",
              cursor: "pointer",
              fontSize: "13.5px"
            }}
          >
            <option value="none">No Digest (Instant only)</option>
            <option value="daily">Daily Summary Email</option>
            <option value="weekly">Weekly Summary Email</option>
          </select>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            If selected, immediate alerts will be batched into a single summary digest email.
          </span>
        </div>

        {/* Notification Categories */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label style={{ fontWeight: "600", fontSize: "14px", color: "var(--color-text-primary)" }}>
            Notify me about
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginLeft: "4px" }}>
            {["answer", "comment", "vote", "accept", "badge"].map((cat) => (
              <label key={cat} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13.5px", color: "var(--color-text-primary)" }}>
                <input
                  type="checkbox"
                  checked={preferences.categories.includes(cat)}
                  onChange={() => handleCategoryToggle(cat)}
                  style={{ width: "15px", height: "15px", accentColor: "var(--color-brand-primary, #f48225)" }}
                />
                <span style={{ textTransform: "capitalize" }}>{cat === "accept" ? "Accepted Answers" : cat + "s"}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary"
          style={{
            alignSelf: "flex-start",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: "600",
            backgroundColor: "var(--color-brand-primary, #f48225)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "background-color 0.2s"
          }}
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>

      </form>
    </div>
  );
};

export default SettingsTab;
