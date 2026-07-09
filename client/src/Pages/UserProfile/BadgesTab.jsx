import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as api from "../../api";
import { format } from "date-fns";

const BadgesTab = ({ userId }) => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        const { data } = await api.getUserBadges(userId);
        setBadges(data);
      } catch (err) {
        console.error("Error fetching user badges:", err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) {
      fetchBadges();
    }
  }, [userId]);

  if (loading) {
    return <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>Loading badges...</p>;
  }

  if (badges.length === 0) {
    return (
      <div style={{ padding: "var(--space-6)", textAlign: "center", border: "1px dashed var(--color-border-light)", borderRadius: "8px" }}>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>No badges earned yet. Keep participating to unlock badges!</p>
      </div>
    );
  }

  // Group by tier
  const goldBadges = badges.filter((b) => b.tier === "gold");
  const silverBadges = badges.filter((b) => b.tier === "silver");
  const bronzeBadges = badges.filter((b) => b.tier === "bronze");

  const renderBadgeGroup = (title, badgeList, colorClass) => {
    if (badgeList.length === 0) return null;
    return (
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "var(--space-3)", color: "var(--color-text-primary)", borderBottom: "1px solid var(--color-border-light)", paddingBottom: "8px" }}>
          {title} ({badgeList.length})
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {badgeList.map((badge) => (
            <div
              key={badge._id}
              className="badge-card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid var(--color-border-light)",
                backgroundColor: "var(--color-bg-card, #161b22)",
                transition: "transform 0.2s, box-shadow 0.2s"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className={`badge-circle ${colorClass}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "50%", fontSize: "12px" }}>
                  ●
                </span>
                <span style={{ fontWeight: "600", fontSize: "15px", color: "var(--color-text-primary)" }}>{badge.name}</span>
              </div>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>{badge.description}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: "11px", color: "var(--color-text-muted)" }}>
                <span>Earned {format(new Date(badge.awardedAt), "MMM dd, yyyy")}</span>
                {badge.sourceId && (
                  <Link to={`/Questions/${badge.sourceId}`} style={{ color: "var(--color-link)", textDecoration: "underline" }}>
                    View Source
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "var(--space-4) 0" }}>
      {renderBadgeGroup("Gold Badges", goldBadges, "gold")}
      {renderBadgeGroup("Silver Badges", silverBadges, "silver")}
      {renderBadgeGroup("Bronze Badges", bronzeBadges, "bronze")}
    </div>
  );
};

export default BadgesTab;
