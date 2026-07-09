import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import * as api from "../../api";
import { useToast } from "../../components/Toast/ToastContext";
import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";

const AdminDashboard = ({ slideIn, handleSlideIn }) => {
  const User = useSelector((state) => state.currentUserReducer);
  const { showToast } = useToast();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = User?.result?.isAdmin;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const { data } = await api.getAdminStats();
        setStats(data);
      } catch (err) {
        console.error(err);
        showToast("Failed to load admin statistics.", "danger");
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [User, isAdmin, showToast]);

  if (!User || !isAdmin) {
    return (
      <div className="home-container-1">
        <LeftSidebar slideIn={slideIn} handleSlideIn={handleSlideIn} />
        <div className="home-container-2" style={{ padding: "var(--space-6)", textAlign: "center" }}>
          <h2 style={{ color: "var(--color-text-primary)" }}>Access Denied</h2>
          <p style={{ color: "var(--color-text-muted)", marginTop: "12px" }}>
            You must be an administrator to access the Admin Dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container-1">
      <LeftSidebar slideIn={slideIn} handleSlideIn={handleSlideIn} />
      <div className="home-container-2" style={{ padding: "var(--space-6)", color: "var(--color-text-primary)" }}>
        <h2 style={{ marginBottom: "var(--space-4)" }}>Admin Dashboard</h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-6)" }}>
          Overview of platform health, activity statistics, user trust levels, and moderation items.
        </p>

        {loading ? (
          <p>Loading stats...</p>
        ) : !stats ? (
          <p>No statistics available.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              
              <div style={{ padding: "20px", borderRadius: "8px", border: "1px solid var(--color-border-light)", backgroundColor: "var(--color-bg-card, #161b22)" }}>
                <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Total Users</div>
                <div style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px", color: "var(--color-text-primary)" }}>{stats.totalUsers}</div>
              </div>

              <div style={{ padding: "20px", borderRadius: "8px", border: "1px solid var(--color-border-light)", backgroundColor: "var(--color-bg-card, #161b22)" }}>
                <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Questions</div>
                <div style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px", color: "var(--color-text-primary)" }}>{stats.totalQuestions}</div>
              </div>

              <div style={{ padding: "20px", borderRadius: "8px", border: "1px solid var(--color-border-light)", backgroundColor: "var(--color-bg-card, #161b22)" }}>
                <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Answers</div>
                <div style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px", color: "var(--color-text-primary)" }}>{stats.totalAnswers}</div>
              </div>

              <div style={{ padding: "20px", borderRadius: "8px", border: "1px solid var(--color-border-light)", backgroundColor: "var(--color-bg-card, #161b22)", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Pending Edits</div>
                <div style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px", color: "var(--color-text-primary)" }}>{stats.pendingEdits}</div>
                {stats.pendingEdits > 0 && (
                  <Link to="/ReviewQueue" style={{ marginTop: "auto", fontSize: "12px", color: "var(--color-link)", textDecoration: "underline" }}>
                    Review Queue →
                  </Link>
                )}
              </div>

              <div style={{ padding: "20px", borderRadius: "8px", border: "1px solid var(--color-border-light)", backgroundColor: "var(--color-bg-card, #161b22)" }}>
                <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Pending Flags</div>
                <div style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px", color: "#cf222e" }}>{stats.pendingFlags}</div>
              </div>

            </div>

            {/* User Trust Levels Breakdown */}
            <div style={{ padding: "24px", borderRadius: "8px", border: "1px solid var(--color-border-light)", backgroundColor: "var(--color-bg-card, #161b22)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>User Trust Levels Breakdown</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {stats.trustStats.map((item) => (
                  <div key={item.level} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>{item.label}</span>
                    <span style={{ fontSize: "14px", fontWeight: "bold", padding: "2px 8px", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.05)" }}>
                      {item.count} users
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
