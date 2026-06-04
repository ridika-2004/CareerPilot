const s = {
  h1: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  sub: { color: "#888", fontSize: 13, marginBottom: 28 },
  grid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 },
  stat: { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 6, padding: "16px 18px" },
  statNum: { fontSize: 28, fontWeight: 700, lineHeight: 1 },
  statLabel: { color: "#888", fontSize: 12, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionHead: { fontWeight: 600, fontSize: 13, marginBottom: 12, color: "#444" },
  nudge: { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 6, padding: "12px 16px", marginBottom: 8, fontSize: 13, color: "#555", display: "flex", justifyContent: "space-between", alignItems: "center" },
  nudgeBtn: { fontSize: 11, border: "1px solid #ccc", borderRadius: 3, padding: "3px 10px", background: "none", cursor: "pointer" },
  progressRow: { marginBottom: 10 },
  progressLabel: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#555", marginBottom: 4 },
  bar: { height: 5, background: "#ebebeb", borderRadius: 3, overflow: "hidden" },
  fill: (pct) => ({ height: "100%", width: `${pct}%`, background: "#1a1a1a", borderRadius: 3 }),
};

const STATS = [
  { num: 12, label: "Applications sent" },
  { num: 3, label: "Interviews scheduled" },
  { num: 7, label: "Skills added" },
  { num: 5, label: "Day streak" },
];

const NUDGES = [
  "You haven't applied this week. 3 ML roles match your profile.",
  "Your DSA course deadline is tomorrow.",
  "CV last updated 14 days ago — consider refreshing it.",
];

const PROGRESS = [
  { label: "3-month roadmap", pct: 42 },
  { label: "Weekly goal: 5 applications", pct: 60 },
  { label: "Skill gap: System Design", pct: 25 },
];

export default function Dashboard() {
  return (
    <div>
      <div style={s.h1}>Dashboard</div>
      <div style={s.sub}>Here's where you stand this week.</div>

      <div style={s.grid}>
        {STATS.map((st) => (
          <div key={st.label} style={s.stat}>
            <div style={s.statNum}>{st.num}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      <div style={s.section}>
        <div style={s.sectionHead}>AI Nudges</div>
        {NUDGES.map((n) => (
          <div key={n} style={s.nudge}>
            <span>{n}</span>
            <button style={s.nudgeBtn}>Dismiss</button>
          </div>
        ))}
      </div>

      <div style={s.section}>
        <div style={s.sectionHead}>Progress</div>
        {PROGRESS.map((p) => (
          <div key={p.label} style={s.progressRow}>
            <div style={s.progressLabel}>
              <span>{p.label}</span>
              <span>{p.pct}%</span>
            </div>
            <div style={s.bar}>
              <div style={s.fill(p.pct)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}