import useAuth from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import { Briefcase, FileText, MessageSquare, KanbanSquare, ArrowRight, Zap, Target, TrendingUp, Users } from "lucide-react";

const FEATURES = [
  {
    icon: <Briefcase size={24} />,
    title: "Intelligent Job Hunting",
    desc: "Search real jobs from BDJobs, Remotive, and Arbeitnow in plain English. Results ranked by query match + CV fit.",
    color: "#1a1a1a",
  },
  {
    icon: <FileText size={24} />,
    title: "CV Intelligence",
    desc: "Upload your CV once. Our AI extracts skills, experience, and education to power smart matching across every feature.",
    color: "#555555",
  },
  {
    icon: <MessageSquare size={24} />,
    title: "AI Career Assistant",
    desc: "Ask anything — gap analysis, cover letters, interview prep. Grounded in your real CV data, not generic advice.",
    color: "#333333",
  },
  {
    icon: <KanbanSquare size={24} />,
    title: "Application Tracker",
    desc: "Kanban board, calendar view, weekly goals. Track every application from wishlist to offer in one place.",
    color: "#888888",
  },
];

const STEPS = [
  { text: "Create your account and upload your CV to build your career profile.", label: "Set Up", icon: <Users size={16} /> },
  { text: "Let the Job Hunter surface real opportunities matched to your skills and location.", label: "Discover", icon: <Target size={16} /> },
  { text: "Track applications, set weekly goals, and monitor your progress.", label: "Track", icon: <TrendingUp size={16} /> },
  { text: "Use the AI Assistant for gap analysis, cover letters, and interview prep.", label: "Prepare", icon: <Zap size={16} /> },
];

const STATS = [
  { value: "3+", label: "Job Sources" },
  { value: "AI", label: "CV Scoring" },
  { value: "Real-time", label: "Matching" },
  { value: "24/7", label: "Assistant" },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      {/* Full-page floating bubbles */}
      <div className="bubble-layer">
        {Array.from({length: 8}, (_, i) => <div key={i} className={`bubble bubble-${i + 1}`} />)}
      </div>

      {/* NAV */}
      <nav style={s.nav}>
        <div style={s.logoWrap}>
          <div style={s.logoMark}><Zap size={18} /></div>
          <span style={s.logo}>CareerPilot</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {user ? (
            <button style={s.btnPrimary} onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </button>
          ) : (
            <>
              <button style={s.btnOutline} onClick={() => navigate("/login")}>Log In</button>
              <button style={s.btnPrimary} onClick={() => navigate("/signup")}>Create Account</button>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={s.hero}>
        <div style={s.heroTag} className="anim-fade-up">Your Career, Managed with Precision</div>
        <h1 style={s.heroTitle} className="anim-fade-up anim-fade-up-d1">
          Hunt jobs, track applications,<br />
          and <span style={s.heroAccent}>land your next role</span>
        </h1>
        <p style={s.heroSub} className="anim-fade-up anim-fade-up-d2">
          CareerPilot is an agentic career co-pilot that searches real job boards,
          scores opportunities against your CV, and helps you manage every step
          of the application journey.
        </p>
        <div style={s.heroBtns} className="anim-fade-up anim-fade-up-d3">
          <button style={s.btnHeroPrimary} onClick={() => navigate(user ? "/dashboard" : "/signup")}>
            {user ? "Open Dashboard" : "Get Started"} <ArrowRight size={18} />
          </button>
          {!user && (
            <button style={s.btnHeroSecondary} onClick={() => navigate("/login")}>
              Sign In
            </button>
          )}
        </div>
      </section>

      {/* STATS */}
      <div style={s.statsBar} className="anim-fade-up anim-fade-up-d4">
        <div style={s.statsInner}>
          {STATS.map((st) => (
            <div key={st.label} style={s.statCell}>
              <div style={s.statValue}>{st.value}</div>
              <div style={s.statLabel}>{st.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section style={s.section}>
        <div style={s.sectionTag}>Core Capabilities</div>
        <div style={s.sectionTitle}>Everything you need to land your next role</div>
        <div style={s.sectionSub}>
          Four integrated tools working together to accelerate your job search.
        </div>
        <div style={s.grid}>
          {FEATURES.map((f, i) => (
            <div key={i} style={s.card}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
            >
              <div style={s.cardIcon(f.color)}>{f.icon}</div>
              <div style={s.cardTitle}>{f.title}</div>
              <div style={s.cardDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={s.howSection}>
        <div style={s.sectionTag}>How It Works</div>
        <div style={{ ...s.sectionTitle, marginBottom: 48 }}>Four steps to your next role</div>
        {STEPS.map((step, i) => (
          <div key={i} style={s.step}>
            <div style={s.stepNum}>{step.icon}</div>
            {i < STEPS.length - 1 && <div style={s.stepLine} />}
            <div style={s.stepContent}>
              <div style={s.stepLabel}>{step.label}</div>
              <div style={s.stepText}>{step.text}</div>
            </div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section style={s.cta}>
        <div style={s.ctaInner}>
          <div style={s.ctaTitle}>Ready to take control of your career?</div>
          <div style={s.ctaSub}>Join CareerPilot and let AI do the heavy lifting.</div>
          <button style={s.ctaBtn} onClick={() => navigate(user ? "/dashboard" : "/signup")}>
            {user ? "Go to Dashboard" : "Create Free Account"}
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={s.footer}>
        <span style={{ fontWeight: 600 }}>CareerPilot</span>
        <span>Built for professionals who take their career seriously.</span>
      </footer>
    </div>
  );
}

const s = {
  page: {
    fontFamily: "var(--font-sans)",
    minHeight: "100vh",
    color: "var(--text-primary)",
  },
  nav: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 48px",
    background: "var(--nav-bg)", backdropFilter: "blur(12px)",
    borderBottom: "1px solid var(--border-light)",
  },
  logoWrap: { display: "flex", alignItems: "center", gap: 10 },
  logoMark: {
    width: 36, height: 36, borderRadius: 10,
    background: "var(--accent-gradient)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--btn-accent-text)",
  },
  logo: { fontWeight: 700, fontSize: 18, color: "var(--text-primary)" },
  btnOutline: {
    padding: "9px 22px", border: "1px solid var(--border)", borderRadius: 8,
    background: "transparent", color: "var(--text-primary)",
    fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, cursor: "pointer",
  },
  btnPrimary: {
    padding: "9px 22px", border: "none", borderRadius: 8,
    background: "var(--accent-gradient)", color: "var(--btn-accent-text)",
    fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, cursor: "pointer",
  },
  hero: {
    maxWidth: 800, margin: "0 auto", padding: "160px 24px 100px", textAlign: "center",
    position: "relative",
  },
  heroTag: {
    display: "inline-block", fontSize: 11, fontWeight: 600, letterSpacing: "1.5px",
    textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 24,
    padding: "6px 16px", border: "1px solid var(--border)", borderRadius: 100,
    background: "var(--bg-card)", position: "relative", zIndex: 3,
  },
  heroTitle: {
    fontSize: 48, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-1.5px",
    color: "var(--text-primary)", marginBottom: 24,
    position: "relative", zIndex: 3,
  },
  heroAccent: {
    background: "linear-gradient(135deg, var(--text-primary) 0%, var(--text-muted) 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
  },
  heroSub: {
    fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.8,
    maxWidth: 580, margin: "0 auto 44px",
    position: "relative", zIndex: 3,
  },
  heroBtns: { display: "flex", justifyContent: "center", gap: 16, position: "relative", zIndex: 3 },
  btnHeroPrimary: {
    padding: "14px 36px", border: "none", borderRadius: 10,
    background: "var(--accent-gradient)", color: "var(--btn-accent-text)",
    fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 8,
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
  },
  btnHeroSecondary: {
    padding: "14px 36px", border: "1px solid var(--border)", borderRadius: 10,
    background: "var(--bg-card)", color: "var(--text-primary)",
    fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, cursor: "pointer",
  },
  statsBar: { maxWidth: 800, margin: "0 auto", padding: "0 24px 80px" },
  statsInner: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1,
    background: "var(--border-light)", borderRadius: 12, overflow: "hidden",
    boxShadow: "var(--shadow-sm)",
  },
  statCell: { background: "var(--bg-card)", padding: "28px 16px", textAlign: "center" },
  statValue: {
    fontSize: 22, fontWeight: 700, color: "var(--text-primary)",
    marginBottom: 4, letterSpacing: "-0.5px",
  },
  statLabel: {
    fontSize: 11, color: "var(--text-muted)", fontWeight: 500,
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  section: { maxWidth: 960, margin: "0 auto", padding: "0 24px 100px" },
  sectionTag: {
    fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase",
    letterSpacing: "2px", marginBottom: 12, textAlign: "center",
  },
  sectionTitle: {
    fontSize: 28, fontWeight: 700, color: "var(--text-primary)",
    textAlign: "center", marginBottom: 12, letterSpacing: "-0.5px",
  },
  sectionSub: {
    fontSize: 14, color: "var(--text-secondary)", textAlign: "center", marginBottom: 48,
    maxWidth: 480, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7,
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  card: {
    background: "var(--bg-card)", border: "1px solid var(--border-light)",
    borderRadius: 14, padding: "32px 28px", cursor: "default",
    boxShadow: "var(--shadow-sm)", transition: "all 0.3s",
  },
  cardIcon: (color) => ({
    width: 48, height: 48, borderRadius: 12,
    background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center",
    color: color, marginBottom: 20,
  }),
  cardTitle: {
    fontWeight: 600, fontSize: 16, color: "var(--text-primary)",
    marginBottom: 10, letterSpacing: "-0.3px",
  },
  cardDesc: { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 },
  howSection: { maxWidth: 680, margin: "0 auto", padding: "0 24px 100px" },
  step: {
    display: "flex", gap: 20, alignItems: "flex-start",
    position: "relative", paddingBottom: 32,
  },
  stepLine: {
    position: "absolute", left: 17, top: 36, bottom: 0, width: 1,
    background: "var(--border-light)",
  },
  stepNum: {
    width: 36, height: 36, borderRadius: "50%",
    background: "var(--accent-gradient)", color: "var(--btn-accent-text)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, position: "relative", zIndex: 2,
  },
  stepContent: { paddingTop: 5 },
  stepLabel: {
    fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
    textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4,
  },
  stepText: { fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8 },
  cta: { maxWidth: 960, margin: "0 auto", padding: "0 24px 100px" },
  ctaInner: {
    background: "var(--accent-gradient)", borderRadius: 20,
    padding: "64px 48px", textAlign: "center", position: "relative", overflow: "hidden",
  },
  ctaTitle: {
    fontSize: 28, fontWeight: 700, color: "var(--btn-accent-text)",
    marginBottom: 16, letterSpacing: "-0.5px", position: "relative", zIndex: 2,
  },
  ctaSub: {
    fontSize: 14, color: "var(--btn-accent-text)", opacity: 0.85, marginBottom: 36,
    lineHeight: 1.7, position: "relative", zIndex: 2,
  },
  ctaBtn: {
    padding: "14px 40px", border: "none", borderRadius: 10,
    background: "var(--bg-card)", color: "var(--text-primary)",
    fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, cursor: "pointer",
    position: "relative", zIndex: 2,
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },
  footer: {
    borderTop: "1px solid var(--border-light)", padding: "24px 48px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    fontSize: 12, color: "var(--text-muted)",
  },
};
