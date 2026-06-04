import { useState, useEffect } from "react";
import axios from "axios";

const nudgeAccent = {
  warning: { bg: "#fafafa", border: "#e0e0e0", dot: "#555" },
  info:    { bg: "#fafafa", border: "#e0e0e0", dot: "#555" },
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
    transition: "box-shadow 0.2s",
  },
  statNum: { fontSize: 32, fontWeight: 800, lineHeight: 1, color: "#111" },
  statLabel: { color: "#888", fontSize: 12, marginTop: 6 },
  section: { marginBottom: 28 },
  sectionHead: {
    fontWeight: 700, fontSize: 13, marginBottom: 14, color: "#222",
    display: "flex", alignItems: "center", gap: 6,
  },
  nudgeCard: (type) => ({
    background: nudgeAccent[type]?.bg || "#f9f9f9",
    border: `1px solid ${nudgeAccent[type]?.border || "#e5e5e5"}`,
    borderRadius: 8,
    padding: "12px 14px",
    marginBottom: 10,
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  }),
  nudgeIcon: () => ({
    fontSize: 18,
    flexShrink: 0,
    marginTop: 1,
  }),
  nudgeText: { fontSize: 13, color: "#333", flex: 1, lineHeight: 1.5 },
  nudgeAction: {
    fontSize: 11,
    border: "1px solid #ccc",
    borderRadius: 4,
    padding: "3px 10px",
    background: "none",
    cursor: "pointer",
    color: "#1a1a1a",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    alignSelf: "center",
    fontWeight: 600,
  },
  dismissBtn: {
    background: "none", border: "none", color: "#bbb", cursor: "pointer",
    fontSize: 14, padding: 0, alignSelf: "center", marginLeft: 4,
  },
  progressRow: { marginBottom: 14 },
  progressLabel: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#444", marginBottom: 6 },
  bar: { height: 7, background: "#ebebeb", borderRadius: 4, overflow: "hidden" },
  fill: (pct) => ({
    height: "100%",
    width: `${pct}%`,
    background: "#1a1a1a",
    borderRadius: 4,
    transition: "width 0.6s ease",
  }),
  loader: {
    display: "flex", alignItems: "center", gap: 8,
    color: "#888", fontSize: 13, padding: "16px 0",
  },
  empty: { color: "#bbb", fontSize: 13, padding: "12px 0", textAlign: "center" },
};



export default function Dashboard({ setPage }) {
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

  const fetchNudges = async () => {
    setNudgesLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/tracker/nudges/?user_id=${userId}`);
      setNudges(res.data);
    } catch (err) {
      console.error("Error loading nudges:", err);
    } finally {
      setNudgesLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setNudgesLoading(true);
      try {
        const [statsRes, nudgesRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/tracker/dashboard/?user_id=${userId}`),
          axios.get(`http://localhost:8000/api/tracker/nudges/?user_id=${userId}`),
        ]);
        if (!cancelled) {
          setStats(statsRes.data);
          setNudges(nudgesRes.data);
        }
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setNudgesLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const statsList = [
    { num: stats.applications_sent, label: "Applications sent" },
    { num: stats.interviews_scheduled, label: "Interviews scheduled" },
    { num: stats.skills_added, label: "Skills in CV" },
    { num: stats.streak, label: "Day streak" },
  ];

  const goalPct = stats.goal_target > 0
    ? Math.min(100, Math.round((stats.weekly_progress / stats.goal_target) * 100))
    : 0;

  const roadmapPct = stats.goal_target > 0
    ? Math.min(100, Math.round((stats.weekly_progress / stats.goal_target) * 100))
    : 0;

  const progressList = [
    { label: `Weekly job goal: ${stats.weekly_progress} / ${stats.goal_target} applications`, pct: goalPct },
    { label: "Interview conversion rate", pct: stats.applications_sent > 0 ? Math.min(100, Math.round((stats.interviews_scheduled / stats.applications_sent) * 100)) : 0 },
    { label: "Skills tracked", pct: Math.min(100, stats.skills_added * 5) },
    { label: "Roadmap progress", pct: roadmapPct },
  ];

  const visibleNudges = nudges.filter((_, i) => !dismissed.has(i));

  const handleNudgeAction = (action) => {
    const target = NUDGE_NAV[action];
    if (target && setPage) {
      setPage(target);
    }
  };

  return (
    <div style={s.wrap}>
      <div style={s.h1}>Dashboard</div>
      <div style={s.sub}>Your career progress at a glance — updated in real time.</div>

      {/* Stat Cards */}
      <div style={s.grid}>
        {statsList.map((st) => (
          <div key={st.label} style={s.stat}>
            <div style={s.statNum}>{loading ? "\u2014" : st.num}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* AI Nudges */}
      <div style={s.section}>
        <div style={s.sectionHead}>
          AI Nudges
        </div>
        {nudgesLoading ? (
          <div style={s.loader}>Analyzing your progress...</div>
        ) : visibleNudges.length === 0 ? (
          <div style={s.empty}>All caught up. No nudges right now.</div>
        ) : (
          visibleNudges.map((nudge, idx) => {
            const originalIdx = nudges.indexOf(nudge);
            return (
              <div key={idx} style={s.nudgeCard(nudge.type)}>
                <span style={s.nudgeText}>{nudge.message}</span>
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
                  onClick={() => setDismissed(new Set([...dismissed, originalIdx]))}
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
        {dismissed.size > 0 && (
          <button
            onClick={() => { setDismissed(new Set()); fetchNudges(); }}
            style={{ fontSize: 11, color: "#888", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
          >
            Refresh nudges
          </button>
        )}
      </div>

      {/* Progress Bars */}
      <div style={s.section}>
        <div style={s.sectionHead}>
          Progress Overview
        </div>
        {progressList.map((p) => (
          <div key={p.label} style={s.progressRow}>
            <div style={s.progressLabel}>
              <span>{p.label}</span>
              <span style={{ fontWeight: 600 }}>{loading ? "—" : `${p.pct}%`}</span>
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
