import useAuth from "../context/useAuth";
import { useNavigate } from "react-router-dom";

const FONT = "'Roboto Mono', monospace";
const DARK = "#1a1a1a";
const CREAM = "#f7f6f3";

/* ── Inline SVG icons ── */
const Icon = {
  search: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  ),
  cv: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
    </svg>
  ),
  chat: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  kanban: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" /><path d="M15 3v18" />
    </svg>
  ),
  arrow: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  ),
};

/* ── Data ── */
const FEATURES = [
  {
    icon: Icon.search,
    title: "Intelligent Job Hunting",
    desc: "Search real jobs from BDJobs, Remotive, and Arbeitnow in plain English. Results ranked by query match + CV fit.",
  },
  {
    icon: Icon.cv,
    title: "CV Intelligence",
    desc: "Upload your CV once. Our AI extracts skills, experience, and education to power smart matching across every feature.",
  },
  {
    icon: Icon.chat,
    title: "AI Career Assistant",
    desc: "Ask anything — gap analysis, cover letters, interview prep. Grounded in your real CV data, not generic advice.",
  },
  {
    icon: Icon.kanban,
    title: "Application Tracker",
    desc: "Kanban board, calendar view, weekly goals. Track every application from wishlist to offer in one place.",
  },
];

const STEPS = [
  { text: "Create your account and upload your CV to build your career profile.", label: "Set Up" },
  { text: "Let the Job Hunter surface real opportunities matched to your skills and location.", label: "Discover" },
  { text: "Track applications, set weekly goals, and monitor your progress.", label: "Track" },
  { text: "Use the AI Assistant for gap analysis, cover letters, and interview prep.", label: "Prepare" },
];

const STATS = [
  { value: "3+", label: "Job Sources" },
  { value: "AI", label: "CV Scoring" },
  { value: "Real-time", label: "Matching" },
  { value: "24/7", label: "Assistant" },
];

/* ── Hover-aware button component ── */
function HoverBtn({ style, hoverStyle, children, onClick, className }) {
  return (
    <button
      className={className}
      style={{ ...style, transition: "all 0.2s ease" }}
      onClick={onClick}
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
      onMouseLeave={(e) => Object.assign(e.currentTarget.style, style)}
    >
      {children}
    </button>
  );
}

function HoverCard({ style, hoverStyle, children, className }) {
  return (
    <div
      className={className}
      style={{ ...style, transition: "all 0.3s ease" }}
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
      onMouseLeave={(e) => Object.assign(e.currentTarget.style, style)}
    >
      {children}
    </div>
  );
}

/* ── Styles ── */
const s = {
  page: {
    fontFamily: FONT,
    background: CREAM,
    minHeight: "100vh",
    color: DARK,
    overflowX: "hidden",
  },

  /* Nav */
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 48px",
    background: "rgba(247,246,243,0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  },
  logo: { fontWeight: 700, fontSize: 18, letterSpacing: "-0.5px", color: DARK },
  logoSub: { fontSize: 10, fontWeight: 400, color: "#999", marginLeft: 8 },
  navBtns: { display: "flex", gap: 12 },
  btnOutline: {
    padding: "8px 22px",
    border: "1px solid #d4d4d4",
    borderRadius: 8,
    background: "transparent",
    color: DARK,
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  btnSolid: {
    padding: "8px 22px",
    border: "1px solid #1a1a1a",
    borderRadius: 8,
    background: DARK,
    color: "#fff",
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },

  /* Hero */
  hero: {
    position: "relative",
    maxWidth: 800,
    margin: "0 auto",
    padding: "160px 24px 100px",
    textAlign: "center",
  },
  heroTag: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    color: "#888",
    marginBottom: 24,
    padding: "6px 16px",
    border: "1px solid #e0e0e0",
    borderRadius: 100,
    background: "#fff",
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: 700,
    lineHeight: 1.15,
    letterSpacing: "-1.5px",
    color: "#111",
    marginBottom: 24,
  },
  heroAccent: {
    background: "linear-gradient(135deg, #1a1a1a 0%, #555 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heroSub: {
    fontSize: 16,
    color: "#666",
    lineHeight: 1.8,
    maxWidth: 580,
    margin: "0 auto 44px",
  },
  heroBtns: { display: "flex", justifyContent: "center", gap: 16 },
  btnHeroPrimary: {
    padding: "14px 36px",
    border: "none",
    borderRadius: 10,
    background: DARK,
    color: "#fff",
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  btnHeroSecondary: {
    padding: "14px 36px",
    border: "1px solid #d4d4d4",
    borderRadius: 10,
    background: "#fff",
    color: DARK,
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },

  /* Floating bubbles */
  bubble: (size, top, left, color, blur) => ({
    position: "absolute",
    width: size,
    height: size,
    borderRadius: "50%",
    background: color || "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(200,200,200,0.15))",
    border: "1px solid rgba(0,0,0,0.04)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04), inset 0 -2px 6px rgba(0,0,0,0.02)",
    filter: blur ? `blur(${blur}px)` : "none",
    top,
    left,
    pointerEvents: "none",
    zIndex: 0,
  }),

  /* Stats bar */
  statsBar: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "0 24px 80px",
  },
  statsInner: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 1,
    background: "#e5e5e5",
    borderRadius: 12,
    overflow: "hidden",
  },
  statCell: {
    background: "#fff",
    padding: "28px 16px",
    textAlign: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: DARK,
    marginBottom: 4,
    letterSpacing: "-0.5px",
  },
  statLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  /* Features */
  section: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "0 24px 100px",
  },
  sectionTag: {
    fontSize: 11,
    fontWeight: 600,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: "2px",
    marginBottom: 12,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: "#111",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: "-0.5px",
  },
  sectionSub: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 48,
    maxWidth: 480,
    marginLeft: "auto",
    marginRight: "auto",
    lineHeight: 1.7,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },
  card: {
    background: "#fff",
    border: "1px solid #ebebeb",
    borderRadius: 14,
    padding: "32px 28px",
    cursor: "default",
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: CREAM,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#555",
    marginBottom: 20,
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: 16,
    color: DARK,
    marginBottom: 10,
    letterSpacing: "-0.3px",
  },
  cardDesc: {
    fontSize: 13,
    color: "#777",
    lineHeight: 1.8,
  },

  /* How it works */
  howSection: {
    maxWidth: 680,
    margin: "0 auto",
    padding: "0 24px 100px",
  },
  step: {
    display: "flex",
    gap: 20,
    marginBottom: 0,
    alignItems: "flex-start",
    position: "relative",
    paddingBottom: 32,
  },
  stepLine: {
    position: "absolute",
    left: 17,
    top: 36,
    bottom: 0,
    width: 1,
    background: "#e0e0e0",
  },
  stepNum: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: DARK,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 600,
    flexShrink: 0,
    position: "relative",
    zIndex: 2,
  },
  stepContent: { paddingTop: 5 },
  stepLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 1.8,
  },

  /* CTA */
  cta: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "0 24px 100px",
  },
  ctaInner: {
    background: DARK,
    borderRadius: 20,
    padding: "64px 48px",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 16,
    letterSpacing: "-0.5px",
    position: "relative",
    zIndex: 2,
  },
  ctaSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 36,
    lineHeight: 1.7,
    position: "relative",
    zIndex: 2,
  },
  ctaBtn: {
    padding: "14px 40px",
    border: "none",
    borderRadius: 10,
    background: "#fff",
    color: DARK,
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    position: "relative",
    zIndex: 2,
  },
  ctaOrb: (size, top, left, opacity) => ({
    position: "absolute",
    width: size,
    height: size,
    borderRadius: "50%",
    background: `rgba(255,255,255,${opacity})`,
    top,
    left,
    pointerEvents: "none",
  }),

  /* Footer */
  footer: {
    borderTop: "1px solid #e5e5e5",
    padding: "24px 48px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12,
    color: "#bbb",
  },
};

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      {/* ── NAV ── */}
      <nav style={s.nav}>
        <div>
          <span style={s.logo}>CareerPilot</span>
          <span style={s.logoSub}>agentic co-pilot</span>
        </div>
        <div style={s.navBtns}>
          {user ? (
            <HoverBtn style={s.btnSolid} hoverStyle={{ opacity: 0.85 }} onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </HoverBtn>
          ) : (
            <>
              <HoverBtn style={s.btnOutline} hoverStyle={{ background: "#f5f5f5" }} onClick={() => navigate("/login")}>
                Log In
              </HoverBtn>
              <HoverBtn style={s.btnSolid} hoverStyle={{ opacity: 0.85 }} onClick={() => navigate("/signup")}>
                Create Account
              </HoverBtn>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={s.hero}>
        {/* Floating bubbles — hero area */}
        <div style={s.bubble(100, "8%", "6%")} className="anim-float" />
        <div style={s.bubble(60, "18%", "88%")} className="anim-float-delayed" />
        <div style={s.bubble(44, "55%", "3%")} className="anim-float-slow" />
        <div style={s.bubble(80, "65%", "92%")} className="anim-float" />
        <div style={s.bubble(28, "12%", "45%")} className="anim-float-fast" />
        <div style={s.bubble(36, "75%", "15%")} className="anim-float-drift" />
        <div style={s.bubble(120, "40%", "82%", null, 1)} className="anim-float-slow" />
        <div style={s.bubble(22, "30%", "10%")} className="anim-float-fast" />
        <div style={s.bubble(50, "80%", "75%")} className="anim-float-delayed" />
        <div style={s.bubble(16, "22%", "70%")} className="anim-float" />

        <div style={s.heroTag} className="anim-fade-up">
          Your Career, Managed with Precision
        </div>

        <h1 style={s.heroTitle} className="anim-fade-up anim-fade-up-d1">
          Hunt jobs, track applications,
          <br />
          and <span style={s.heroAccent}>land your next role</span>
        </h1>

        <p style={s.heroSub} className="anim-fade-up anim-fade-up-d2">
          CareerPilot is an agentic career co-pilot that searches real job boards,
          scores opportunities against your CV, and helps you manage every step
          of the application journey.
        </p>

        <div style={s.heroBtns} className="anim-fade-up anim-fade-up-d3">
          <HoverBtn
            style={s.btnHeroPrimary}
            hoverStyle={{ transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
            onClick={() => navigate(user ? "/dashboard" : "/signup")}
          >
            {user ? "Open Dashboard" : "Get Started"} {Icon.arrow}
          </HoverBtn>

          {!user && (
            <HoverBtn
              style={s.btnHeroSecondary}
              hoverStyle={{ background: "#f5f5f5", borderColor: "#bbb" }}
              onClick={() => navigate("/login")}
            >
              Sign In
            </HoverBtn>
          )}
        </div>
      </section>

      {/* ── STATS ── */}
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

      {/* ── FEATURES ── */}
      <section style={{ ...s.section, position: "relative" }}>
        {/* Floating bubbles — features area */}
        <div style={s.bubble(70, "5%", "-5%")} className="anim-float-drift" />
        <div style={s.bubble(40, "60%", "95%")} className="anim-float-slow" />
        <div style={s.bubble(24, "80%", "8%")} className="anim-float-fast" />
        <div style={s.bubble(55, "15%", "100%", null, 1)} className="anim-float-delayed" />

        <div style={s.sectionTag}>Core Capabilities</div>
        <div style={s.sectionTitle}>Everything you need to land your next role</div>
        <div style={s.sectionSub}>
          Four integrated tools working together to accelerate your job search.
        </div>

        <div style={s.grid}>
          {FEATURES.map((f, i) => (
            <HoverCard
              key={i}
              className={`anim-fade-up anim-fade-up-d${i + 1}`}
              style={s.card}
              hoverStyle={{
                transform: "translateY(-4px)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
                borderColor: "#d4d4d4",
              }}
            >
              <div style={s.cardIcon}>{f.icon}</div>
              <div style={s.cardTitle}>{f.title}</div>
              <div style={s.cardDesc}>{f.desc}</div>
            </HoverCard>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ ...s.howSection, position: "relative" }}>
        {/* Floating bubbles — how it works area */}
        <div style={s.bubble(48, "10%", "-12%")} className="anim-float-delayed" />
        <div style={s.bubble(32, "70%", "105%")} className="anim-float" />
        <div style={s.bubble(65, "40%", "-8%", null, 1)} className="anim-float-slow" />

        <div style={s.sectionTag}>How It Works</div>
        <div style={{ ...s.sectionTitle, marginBottom: 48 }}>Four steps to your next role</div>

        {STEPS.map((step, i) => (
          <div key={i} style={s.step} className={`anim-fade-up anim-fade-up-d${i + 1}`}>
            <div style={s.stepNum}>{i + 1}</div>
            {i < STEPS.length - 1 && <div style={s.stepLine} />}
            <div style={s.stepContent}>
              <div style={s.stepLabel}>{step.label}</div>
              <div style={s.stepText}>{step.text}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ── CTA ── */}
      <section style={s.cta}>
        <div style={s.ctaInner}>
          {/* Background orbs */}
          <div style={s.ctaOrb(200, "-30%", "-10%", 0.03)} />
          <div style={s.ctaOrb(300, "-50%", "70%", 0.04)} />
          <div style={s.ctaOrb(120, "60%", "85%", 0.03)} />

          <div style={s.ctaTitle} className="anim-fade-up">
            Ready to take control of your career?
          </div>
          <div style={s.ctaSub} className="anim-fade-up anim-fade-up-d1">
            Join CareerPilot and let AI do the heavy lifting.
          </div>
          <HoverBtn
            style={s.ctaBtn}
            hoverStyle={{ transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(255,255,255,0.15)" }}
            className="anim-fade-up anim-fade-up-d2"
            onClick={() => navigate(user ? "/dashboard" : "/signup")}
          >
            {user ? "Go to Dashboard" : "Create Free Account"}
          </HoverBtn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <span>CareerPilot</span>
        <span>Built for professionals who take their career seriously.</span>
      </footer>
    </div>
  );
}
