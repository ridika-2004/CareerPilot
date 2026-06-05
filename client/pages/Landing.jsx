import useAuth from "../context/useAuth";
import { useNavigate } from "react-router-dom";

const s = {
  page: {
    fontFamily: "'Roboto Mono', monospace",
    background: "#f7f6f3",
    minHeight: "100vh",
    color: "#1a1a1a",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 48px",
    borderBottom: "1px solid #e5e5e5",
    background: "#fff",
  },
  logo: {
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: "-0.5px",
  },
  logoSub: {
    fontSize: 10,
    fontWeight: 400,
    color: "#999",
    marginLeft: 8,
  },
  navBtns: { display: "flex", gap: 12 },
  btnOutline: {
    padding: "8px 20px",
    border: "1px solid #1a1a1a",
    borderRadius: 6,
    background: "transparent",
    color: "#1a1a1a",
    fontFamily: "'Roboto Mono', monospace",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  btnSolid: {
    padding: "8px 20px",
    border: "1px solid #1a1a1a",
    borderRadius: 6,
    background: "#1a1a1a",
    color: "#fff",
    fontFamily: "'Roboto Mono', monospace",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  hero: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "100px 24px 80px",
    textAlign: "center",
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: "-1px",
    color: "#111",
    marginBottom: 20,
  },
  heroSub: {
    fontSize: 15,
    color: "#666",
    lineHeight: 1.8,
    maxWidth: 560,
    margin: "0 auto 40px",
  },
  heroBtns: { display: "flex", justifyContent: "center", gap: 16 },
  btnHeroPrimary: {
    padding: "12px 32px",
    border: "none",
    borderRadius: 6,
    background: "#1a1a1a",
    color: "#fff",
    fontFamily: "'Roboto Mono', monospace",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnHeroSecondary: {
    padding: "12px 32px",
    border: "1px solid #ccc",
    borderRadius: 6,
    background: "transparent",
    color: "#1a1a1a",
    fontFamily: "'Roboto Mono', monospace",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  section: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "0 24px 80px",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    marginBottom: 32,
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: 8,
    padding: "28px 24px",
  },
  cardNum: {
    fontSize: 11,
    fontWeight: 600,
    color: "#bbb",
    marginBottom: 12,
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: 15,
    color: "#1a1a1a",
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: "#666",
    lineHeight: 1.7,
  },
  howSection: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "0 24px 80px",
  },
  step: {
    display: "flex",
    gap: 16,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#1a1a1a",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
  },
  stepText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 1.7,
    paddingTop: 3,
  },
  footer: {
    borderTop: "1px solid #e5e5e5",
    padding: "24px 48px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12,
    color: "#aaa",
  },
};

const FEATURES = [
  { num: "01", title: "Intelligent Job Hunting", desc: "Search for opportunities in plain English..." },
  { num: "02", title: "Profile and CV Intelligence", desc: "Upload your CV once..." },
  { num: "03", title: "AI Career Assistant", desc: "Ask anything about your career..." },
  { num: "04", title: "Application Tracker and Goals", desc: "Kanban board, calendar view..." },
];

const STEPS = [
  "Create your account and upload your CV to build your career profile.",
  "Let the Job Hunter surface relevant opportunities matched to your skills.",
  "Track applications, set weekly goals, and monitor your progress.",
  "Use the AI Assistant for gap analysis, cover letters, and interview prep.",
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div>
          <span style={s.logo}>CareerPilot</span>
          <span style={s.logoSub}>agentic co-pilot</span>
        </div>

        <div style={s.navBtns}>
          {user ? (
            <button style={s.btnSolid} onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </button>
          ) : (
            <>
              <button
                style={s.btnOutline}
                onClick={() => navigate("/login")}
              >
                Log In
              </button>

              <button
                style={s.btnSolid}
                onClick={() => navigate("/signup")}
              >
                Create Account
              </button>
            </>
          )}
        </div>
      </nav>

      <section style={s.hero}>
        <h1 style={s.heroTitle}>
          Your career, managed<br />with precision.
        </h1>

        <p style={s.heroSub}>
          CareerPilot is an agentic career co-pilot...
        </p>

        <div style={s.heroBtns}>
          <button
            style={s.btnHeroPrimary}
            onClick={() => navigate(user ? "/dashboard" : "/signup")}
          >
            {user ? "Open Dashboard" : "Get Started"}
          </button>

          {!user && (
            <button
              style={s.btnHeroSecondary}
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>
          )}
        </div>
      </section>

      <section style={s.section}>
        <div style={s.sectionTitle}>Core Capabilities</div>
        <div style={s.grid}>
          {FEATURES.map((f) => (
            <div key={f.num} style={s.card}>
              <div style={s.cardNum}>{f.num}</div>
              <div style={s.cardTitle}>{f.title}</div>
              <div style={s.cardDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={s.howSection}>
        <div style={s.sectionTitle}>How It Works</div>
        {STEPS.map((text, i) => (
          <div key={i} style={s.step}>
            <div style={s.stepNum}>{i + 1}</div>
            <div style={s.stepText}>{text}</div>
          </div>
        ))}
      </section>

      <footer style={s.footer}>
        <span>CareerPilot</span>
        <span>Built for professionals who take their career seriously.</span>
      </footer>
    </div>
  );
}