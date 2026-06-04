const s = {
  wrap: { fontFamily: "'Roboto Mono', monospace", maxWidth: 700 },
  hero: {
    fontSize: 28, fontWeight: 700, lineHeight: 1.25, color: "#1a1a1a", marginBottom: 12,
    letterSpacing: "-0.5px",
  },
  sub: { fontSize: 14, color: "#555", lineHeight: 1.7, marginBottom: 32 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 32 },
  card: {
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: 8,
    padding: "20px 18px",
    cursor: "pointer",
    transition: "box-shadow 0.15s, transform 0.15s",
  },
  cardTitle: { fontWeight: 600, fontSize: 14, color: "#1a1a1a", marginBottom: 6 },
  cardDesc: { fontSize: 12, color: "#555", lineHeight: 1.6 },
  tipsWrap: { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 8, padding: "20px 22px" },
  tipsHead: { fontWeight: 600, fontSize: 14, marginBottom: 12, color: "#1a1a1a" },
  tipItem: { display: "flex", gap: 10, marginBottom: 10, fontSize: 13, color: "#444", lineHeight: 1.6 },
  tipNum: { fontWeight: 600, color: "#1a1a1a", flexShrink: 0 },
};

const PILLARS = [
  { title: "Job Hunter", desc: "Search in plain English. AI finds, filters, and scores jobs against your CV.", page: "jobs" },
  { title: "Profile & CV Intelligence", desc: "Upload your CV — semantically indexed and queried by every agent.", page: "profile" },
  { title: "AI Assistant", desc: "Ask anything about your career. Get grounded answers from your real CV data.", page: "assistant" },
  { title: "Tracker & Goals", desc: "Kanban board, calendar, goals, to-dos, and AI nudges to stay on track.", page: "tracker" },
];

const TIPS = [
  { num: "01", text: "Upload your CV first — every feature gets smarter with your real data." },
  { num: "02", text: "Use the Job Hunter to find opportunities, then click 'Apply' to track them instantly." },
  { num: "03", text: "Ask the Assistant for gap analysis, roadmaps, or cover letters — it knows your CV." },
  { num: "04", text: "Set weekly goals and check the Dashboard daily for AI-powered nudges." },
];

export default function Home({ setPage }) {
  return (
    <div style={s.wrap}>
      <div style={s.hero}>
        Welcome to CareerPilot
      </div>
      <div style={s.sub}>
        Your agentic career co-pilot. Four AI-powered pillars work together to hunt jobs,
        analyze your profile, guide your growth, and keep you accountable — all grounded in your real CV.
      </div>

      <div style={s.grid}>
        {PILLARS.map((p) => (
          <div
            key={p.title}
            style={s.card}
            onClick={() => setPage?.(p.page)}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
          >
            <div style={s.cardTitle}>{p.title}</div>
            <div style={s.cardDesc}>{p.desc}</div>
          </div>
        ))}
      </div>

      <div style={s.tipsWrap}>
        <div style={s.tipsHead}>Getting Started</div>
        {TIPS.map((t) => (
          <div key={t.num} style={s.tipItem}>
            <span style={s.tipNum}>{t.num}</span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
