import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API_URL from "../src/config";

const nudgeAccent = {
  warning: { bg: "#fafafa", border: "#e0e0e0", dot: "#555" },
  info: { bg: "#fafafa", border: "#e0e0e0", dot: "#555" },
  success: { bg: "#fafafa", border: "#e0e0e0", dot: "#555" },
};

const NUDGE_NAV = {
  "Go to Job Hunter": "jobs",
  "Open Tracker": "tracker",
  "Upload CV": "profile",
  "Open Tasks": "tracker",
  "Open Goals": "tracker",
};

const s = {
  wrap: { fontFamily: "'Roboto Mono', monospace" },
  h1: { fontSize: 22, fontWeight: 700, marginBottom: 4, color: "#111" },
  sub: { color: "#888", fontSize: 13, marginBottom: 28 },
  grid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 32 },
  stat: {
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: 8,
    padding: "20px 20px 16px",
  },
  statNum: { fontSize: 32, fontWeight: 800, color: "#111" },
  statLabel: { color: "#888", fontSize: 12, marginTop: 6 },

  section: { marginBottom: 28 },
  sectionHead: {
    fontWeight: 700,
    fontSize: 13,
    marginBottom: 14,
    color: "#222",
  },

  nudgeCard: (type) => ({
    background: nudgeAccent[type]?.bg || "#f9f9f9",
    border: `1px solid ${nudgeAccent[type]?.border || "#e5e5e5"}`,
    borderRadius: 8,
    padding: "12px 14px",
    marginBottom: 10,
    display: "flex",
    gap: 10,
  }),

  nudgeText: { fontSize: 13, color: "#333", flex: 1 },

  nudgeAction: {
    fontSize: 11,
    border: "1px solid #ccc",
    borderRadius: 4,
    padding: "3px 10px",
    background: "none",
    cursor: "pointer",
    fontWeight: 600,
  },

  dismissBtn: {
    background: "none",
    border: "none",
    color: "#bbb",
    cursor: "pointer",
    fontSize: 14,
  },

  progressRow: { marginBottom: 14 },
  progressLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    color: "#444",
    marginBottom: 6,
  },
  bar: {
    height: 7,
    background: "#ebebeb",
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: (pct) => ({
    height: "100%",
    width: `${pct}%`,
    background: "#1a1a1a",
  }),

  loader: { color: "#888", fontSize: 13, padding: "16px 0" },
  empty: { color: "#bbb", fontSize: 13, padding: "12px 0", textAlign: "center" },
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    applications_sent: 0,
    interviews_scheduled: 0,
    skills_added: 0,
    streak: 0,
    weekly_progress: 0,
    goal_target: 5,
  });

  const [nudges, setNudges] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [nudgesLoading, setNudgesLoading] = useState(true);

  const userId = localStorage.getItem("user_id") || "user_default";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setNudgesLoading(true);

      try {
        const [statsRes, nudgesRes] = await Promise.all([
          axios.get(`${API_URL}/api/tracker/dashboard/?user_id=${userId}`),
          axios.get(`${API_URL}/api/tracker/nudges/?user_id=${userId}`),
        ]);

        setStats(statsRes.data);
        setNudges(nudgesRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setNudgesLoading(false);
      }
    };

    load();
  }, []);

  const statsList = [
    { num: stats.applications_sent, label: "Applications sent" },
    { num: stats.interviews_scheduled, label: "Interviews scheduled" },
    { num: stats.skills_added, label: "Skills in CV" },
    { num: stats.streak, label: "Day streak" },
  ];

  const handleNudgeAction = (action) => {
    const target = NUDGE_NAV[action];
    if (target) {
      navigate(`/${target}`);
    }
  };

  const visibleNudges = nudges.filter((_, i) => !dismissed.has(i));

  return (
    <div style={s.wrap}>
      <div style={s.h1}>Dashboard</div>
      <div style={s.sub}>Your career progress at a glance</div>

      {/* Stats */}
      <div style={s.grid}>
        {statsList.map((st) => (
          <div key={st.label} style={s.stat}>
            <div style={s.statNum}>{loading ? "—" : st.num}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* Nudges */}
      <div style={s.section}>
        <div style={s.sectionHead}>AI Nudges</div>

        {nudgesLoading ? (
          <div style={s.loader}>Loading...</div>
        ) : visibleNudges.length === 0 ? (
          <div style={s.empty}>All caught up</div>
        ) : (
          visibleNudges.map((nudge, idx) => (
            <div key={idx} style={s.nudgeCard(nudge.type)}>
              <div style={s.nudgeText}>{nudge.message}</div>

              {nudge.action && (
                <button
                  style={s.nudgeAction}
                  onClick={() => handleNudgeAction(nudge.action)}
                >
                  {nudge.action}
                </button>
              )}

              <button
                style={s.dismissBtn}
                onClick={() =>
                  setDismissed(new Set([...dismissed, idx]))
                }
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* Progress */}
      <div style={s.section}>
        <div style={s.sectionHead}>Progress</div>

        {[
          {
            label: "Weekly goal",
            pct:
              stats.goal_target > 0
                ? Math.round((stats.weekly_progress / stats.goal_target) * 100)
                : 0,
          },
        ].map((p) => (
          <div key={p.label} style={s.progressRow}>
            <div style={s.progressLabel}>
              <span>{p.label}</span>
              <span>{loading ? "—" : `${p.pct}%`}</span>
            </div>
            <div style={s.bar}>
              <div style={s.fill(loading ? 0 : p.pct)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}