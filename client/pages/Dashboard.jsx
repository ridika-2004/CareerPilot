import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import api from "../src/api";
import { Send, CalendarCheck, Code2, Flame, TrendingUp, X, ArrowRight, Sparkles } from "lucide-react";

const NUDGE_NAV = {
  "Go to Job Hunter": "jobs",
  "Open Tracker": "tracker",
  "Upload CV": "profile",
  "Open Tasks": "tracker",
  "Open Goals": "tracker",
};

const STAT_CONFIG = [
  { key: "applications_sent", label: "Applications Sent", icon: Send },
  { key: "interviews_scheduled", label: "Interviews", icon: CalendarCheck },
  { key: "skills_added", label: "CV Skills", icon: Code2 },
  { key: "streak", label: "Day Streak", icon: Flame },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.user_id?.toString() || "";

  const [stats, setStats] = useState({ applications_sent: 0, interviews_scheduled: 0, skills_added: 0, streak: 0, weekly_progress: 0, goal_target: 5 });
  const [nudges, setNudges] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [nudgesLoading, setNudgesLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      setNudgesLoading(true);
      try {
        const [statsRes, nudgesRes] = await Promise.all([
          api.get(`/api/tracker/dashboard/?user_id=${userId}`),
          api.get(`/api/tracker/nudges/?user_id=${userId}`),
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
  }, [userId]);

  const handleNudgeAction = (action) => {
    const target = NUDGE_NAV[action];
    if (target) navigate(`/${target}`);
  };

  const visibleNudges = nudges.filter((_, i) => !dismissed.has(i));
  const goalPct = stats.goal_target > 0 ? Math.min(100, Math.round((stats.weekly_progress / stats.goal_target) * 100)) : 0;

  return (
    <div style={s.wrap} className="anim-fade-up">
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>
            Welcome back, {user?.full_name?.split(" ")[0] || user?.username || "there"}
          </h1>
          <p style={s.sub}>Here's your career progress at a glance</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={s.statsGrid}>
        {STAT_CONFIG.map((st, idx) => {
          const Icon = st.icon;
          return (
            <div key={st.key} style={s.statCard} className={`anim-fade-up anim-fade-up-d${idx + 1}`}>
              {/* <div style={s.statIconWrap}>
                <Icon size={18} strokeWidth={2} />
              </div> */}
              <div style={s.statNum}>{loading ? "—" : stats[st.key]}</div>
              <div style={s.statLabel}>{st.label}</div>
            </div>
          );
        })}
      </div>

      {/* Two column layout: Nudges + Progress */}
      <div style={s.twoCol}>
        {/* Nudges */}
        <div style={s.section}>
          <div style={s.sectionHead}>
            <Sparkles size={16} strokeWidth={2} style={{ color: "var(--accent)" }} />
            <span>AI Nudges</span>
          </div>

          {nudgesLoading ? (
            <div style={s.skeletonCard}>
              <div className="shimmer-bg" style={{ height: 48, borderRadius: 8 }} />
              <div className="shimmer-bg" style={{ height: 48, borderRadius: 8, marginTop: 8 }} />
            </div>
          ) : visibleNudges.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>
                <TrendingUp size={20} />
              </div>
              <div style={s.emptyText}>All caught up! Great work.</div>
            </div>
          ) : (
            visibleNudges.map((nudge, idx) => (
              <div key={idx} style={s.nudgeCard} className="anim-slide-right">
                <div style={s.nudgeDot} />
                <div style={s.nudgeText}>{nudge.message}</div>
                {nudge.action && (
                  <button style={s.nudgeAction} onClick={() => handleNudgeAction(nudge.action)}>
                    {nudge.action} <ArrowRight size={12} />
                  </button>
                )}
                <button style={s.dismissBtn} onClick={() => setDismissed(new Set([...dismissed, idx]))}>
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Progress */}
        <div style={s.progressSection}>
          <div style={s.sectionHead}>
            <TrendingUp size={16} strokeWidth={2} style={{ color: "var(--accent)" }} />
            <span>Weekly Progress</span>
          </div>

          <div style={s.progressCard}>
            <div style={s.progressBigNum}>
              {loading ? "—" : stats.weekly_progress}
              <span style={s.progressTotal}> / {stats.goal_target}</span>
            </div>
            <div style={s.progressLabel}>applications this week</div>

            <div style={s.progressBar}>
              <div style={s.progressFill(loading ? 0 : goalPct)} />
            </div>
            <div style={s.progressPct}>{goalPct}% complete</div>

            <button style={s.goTrackerBtn} onClick={() => navigate("/tracker")}>
              Open Tracker <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: { fontFamily: "var(--font-sans)" },
  header: { marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  h1: { fontSize: 24, fontWeight: 700, marginBottom: 4, color: "var(--text-primary)", letterSpacing: "-0.5px" },
  sub: { color: "var(--text-muted)", fontSize: 14 },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 },
  statCard: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "20px 20px 18px",
    transition: "box-shadow 0.2s, transform 0.2s",
    cursor: "default",
  },
  statIconWrap: {
    width: 38, height: 38, borderRadius: 10, background: "var(--accent-light)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--accent)", marginBottom: 14,
  },
  statNum: { fontSize: 28, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px", marginBottom: 2 },
  statLabel: { color: "var(--text-muted)", fontSize: 12, fontWeight: 500 },

  twoCol: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 },

  section: { marginBottom: 0 },
  sectionHead: {
    display: "flex", alignItems: "center", gap: 8,
    fontWeight: 600, fontSize: 14, marginBottom: 16, color: "var(--text-primary)",
  },

  skeletonCard: { padding: 4 },
  emptyState: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "32px 20px", textAlign: "center",
  },
  emptyIcon: {
    width: 40, height: 40, borderRadius: 10, background: "var(--success-light)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--success)", margin: "0 auto 10px",
  },
  emptyText: { color: "var(--text-muted)", fontSize: 13, fontWeight: 500 },

  nudgeCard: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)", padding: "12px 14px",
    marginBottom: 10, display: "flex", gap: 10, alignItems: "flex-start",
    transition: "box-shadow 0.15s",
  },
  nudgeDot: {
    width: 6, height: 6, borderRadius: "50%", background: "var(--accent)",
    flexShrink: 0, marginTop: 7,
  },
  nudgeText: { fontSize: 13, color: "var(--text-secondary)", flex: 1, lineHeight: 1.5 },
  nudgeAction: {
    display: "flex", alignItems: "center", gap: 4,
    fontSize: 11, border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)", padding: "4px 10px",
    background: "var(--bg-elevated)", cursor: "pointer", fontWeight: 600,
    color: "var(--accent)", whiteSpace: "nowrap", flexShrink: 0,
    transition: "background 0.15s",
  },
  dismissBtn: {
    background: "none", border: "none", color: "var(--text-faint)",
    cursor: "pointer", padding: 2, flexShrink: 0, display: "flex",
  },

  progressSection: {},
  progressCard: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "24px 20px",
    textAlign: "center",
  },
  progressBigNum: {
    fontSize: 40, fontWeight: 800, color: "var(--text-primary)",
    letterSpacing: "-1px", lineHeight: 1,
  },
  progressTotal: { fontSize: 20, color: "var(--text-faint)", fontWeight: 600 },
  progressLabel: { fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 20 },
  progressBar: {
    height: 8, background: "var(--bg-elevated)", borderRadius: 4, overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: (pct) => ({
    height: "100%", width: `${pct}%`,
    background: "var(--accent-gradient)", borderRadius: 4,
    transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
  }),
  progressPct: { fontSize: 12, color: "var(--text-muted)", fontWeight: 500, marginBottom: 16 },
  goTrackerBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
    padding: "8px 18px", background: "transparent", color: "var(--text-secondary)",
    fontSize: 13, fontWeight: 500, cursor: "pointer",
    fontFamily: "var(--font-sans)", transition: "all 0.15s",
  },
};
