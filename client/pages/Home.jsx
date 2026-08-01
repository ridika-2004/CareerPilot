import { useNavigate } from "react-router-dom";
import { Briefcase, FileText, MessageSquare, KanbanSquare, ArrowRight, Lightbulb, Sparkles } from "lucide-react";

const PILLARS = [
  { title: "Job Hunter", desc: "Search in plain English. AI finds, filters, and scores jobs against your CV.", page: "jobs", icon: <Briefcase size={22} />, color: "#1a1a1a" },
  { title: "Profile & CV Intelligence", desc: "Upload your CV — semantically indexed and queried by every agent.", page: "profile", icon: <FileText size={22} />, color: "#555555" },
  { title: "AI Assistant", desc: "Ask anything about your career. Get grounded answers from your real CV data.", page: "assistant", icon: <MessageSquare size={22} />, color: "#333333" },
  { title: "Tracker & Goals", desc: "Kanban board, calendar, goals, to-dos, and AI nudges to stay on track.", page: "tracker", icon: <KanbanSquare size={22} />, color: "#888888" },
];

const TIPS = [
  { num: "01", text: "Upload your CV first — every feature gets smarter with your real data." },
  { num: "02", text: "Use the Job Hunter to find opportunities, then click 'Apply' to track them instantly." },
  { num: "03", text: "Ask the Assistant for gap analysis, roadmaps, or cover letters — it knows your CV." },
  { num: "04", text: "Set weekly goals and check the Dashboard daily for AI-powered nudges." },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.hero}>Welcome to CareerPilot</div>
        <div style={s.sub}>
          Your agentic career co-pilot. Four AI-powered pillars work together to hunt jobs,
          analyze your profile, guide your growth, and keep you accountable — all grounded in your real CV.
        </div>
      </div>

      <div style={s.grid}>
        {PILLARS.map((p) => (
          <div
            key={p.title}
            style={s.card}
            onClick={() => navigate(`/${p.page}`)}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
          >
            <div style={s.cardIcon(p.color)}>{p.icon}</div>
            <div style={s.cardTitle}>{p.title}</div>
            <div style={s.cardDesc}>{p.desc}</div>
            <div style={s.cardLink}>Open <ArrowRight size={14} /></div>
          </div>
        ))}
      </div>

      <div style={s.tipsWrap}>
        <div style={s.tipsHead}>
          <Lightbulb size={18} style={{ color: "#555555" }} />
          Getting Started
        </div>
        <div style={s.tipsSub}>Follow these steps to get the most out of CareerPilot</div>
        {TIPS.map((t) => (
          <div key={t.num} style={s.tipItem}>
            <div style={s.tipNum}>{t.num}</div>
            <div style={s.tipText}>{t.text}</div>
          </div>
        ))}
      </div>

      <div style={s.ctaWrap}>
        <Sparkles size={16} style={{ color: "var(--accent)" }} />
        <span style={s.ctaText}>Pro tip: Upload your CV first to unlock AI-powered matching across all features</span>
      </div>
    </div>
  );
}

const s = {
  wrap: { fontFamily: "var(--font-sans)", maxWidth: 900 },
  header: { marginBottom: 32 },
  hero: {
    fontSize: 28, fontWeight: 700, lineHeight: 1.25, color: "var(--text-primary)",
    marginBottom: 12, letterSpacing: "-0.5px",
  },
  sub: { fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 },
  card: {
    background: "var(--bg-card)", border: "1px solid var(--border-light)",
    borderRadius: "var(--radius-lg)", padding: "24px", cursor: "pointer",
    transition: "all 0.2s", boxShadow: "var(--shadow-sm)",
  },
  cardIcon: (color) => ({
    width: 44, height: 44, borderRadius: 10,
    background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center",
    color: color, marginBottom: 14,
  }),
  cardTitle: { fontWeight: 600, fontSize: 15, color: "var(--text-primary)", marginBottom: 8 },
  cardDesc: { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 12 },
  cardLink: {
    fontSize: 12, color: "var(--accent)", fontWeight: 600,
    display: "flex", alignItems: "center", gap: 4,
  },
  tipsWrap: {
    background: "var(--bg-card)", border: "1px solid var(--border-light)",
    borderRadius: "var(--radius-lg)", padding: "24px", marginBottom: 16,
    boxShadow: "var(--shadow-sm)",
  },
  tipsHead: {
    fontWeight: 600, fontSize: 15, marginBottom: 6, color: "var(--text-primary)",
    display: "flex", alignItems: "center", gap: 8,
  },
  tipsSub: { fontSize: 12, color: "var(--text-muted)", marginBottom: 16 },
  tipItem: {
    display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start",
  },
  tipNum: {
    fontWeight: 700, color: "var(--accent)", flexShrink: 0, fontSize: 12,
    background: "var(--accent-light)", width: 28, height: 28, borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  tipText: { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, paddingTop: 4 },
  ctaWrap: {
    background: "var(--accent-light)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "14px 20px",
    display: "flex", alignItems: "center", gap: 10,
  },
  ctaText: { fontSize: 13, color: "var(--accent)", fontWeight: 500 },
};
