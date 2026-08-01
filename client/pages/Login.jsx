import { useState } from "react";
import useAuth from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Eye, EyeOff, Loader2 } from "lucide-react";
import careerImg from "../src/assets/career.jpg";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(form);
      navigate(data.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Left - Branding */}
      <div style={s.leftPanel}>
        <div style={s.leftInner}>
          <div style={s.brandRow} className="anim-slide-left">
            <div style={s.brandIcon}><Zap size={20} strokeWidth={2.5} /></div>
            <span style={s.brandName}>CareerPilot</span>
          </div>
          <h1 style={s.heroTitle} className="anim-slide-left-d2">Your career,<br />managed with <span className="gradient-text">precision</span>.</h1>
          <p style={s.heroDesc} className="anim-slide-left-d3">
            Hunt jobs, track applications, and get AI-powered career guidance — all in one place.
          </p>
          <div style={s.featureList}>
            {["AI-powered job matching", "Smart application tracking", "Personalized career assistant"].map((f, i) => (
              <div key={f} className={`anim-slide-left-d${i + 3}`} style={s.featureItem}>
                <div style={s.checkDot} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={s.leftDecor1} className="anim-float" />
        <div style={s.leftDecor2} className="anim-float-slow" />
      </div>

      {/* Right - Form */}
      <div style={s.rightPanel}>
        <div style={s.formWrap} className="anim-fade-up">
          <button style={s.backBtn} onClick={() => navigate("/")}>
            <ArrowLeft size={16} /> Back to home
          </button>

          <div style={s.formHeader}>
            <h2 style={s.heading}>Welcome back</h2>
            <p style={s.subtext}>Sign in to continue to your dashboard.</p>
          </div>

          {error && (
            <div style={s.errorBox}>
              <div style={s.errorDot} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Username</label>
              <input
                style={s.input}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Enter your username"
                required
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--border-focus)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--border)"}
              />
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Password</label>
              <div style={s.inputWrap}>
                <input
                  style={{ ...s.input, paddingRight: 40 }}
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                  onFocus={(e) => e.currentTarget.style.borderColor = "var(--border-focus)"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "var(--border)"}
                />
                <button type="button" style={s.eyeBtn} onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button style={s.btn} disabled={loading}>
              {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Signing in...</> : "Sign In"}
            </button>
          </form>

          <div style={s.footer}>
            Don't have an account?{" "}
            <button style={s.link} onClick={() => navigate("/signup")}>Create one</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    fontFamily: "var(--font-sans)",
  },
  leftPanel: {
    flex: "0 0 50%", 
    position: "relative",
    overflow: "hidden",
    background: `linear-gradient(
      135deg,
      rgba(0,0,0,0.92) 0%,
      rgba(0,0,0,0.85) 100%
      ), url(${careerImg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
  },
  leftInner: { position: "relative", zIndex: 2, maxWidth: 420 },
  brandRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 40 },
  brandIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: "var(--accent-gradient)",
    display: "flex", alignItems: "center", justifyContent: "center", color: "var(--btn-accent-text)",
  },
  brandName: { fontWeight: 700, fontSize: 18, color: "#fff", letterSpacing: "-0.3px" },
  heroTitle: {
    fontSize: 36, fontWeight: 800, lineHeight: 1.2, color: "#fff",
    letterSpacing: "-1px", marginBottom: 16,
  },
  heroDesc: { fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 32 },
  featureList: { display: "flex", flexDirection: "column", gap: 12 },
  featureItem: {
    display: "flex", alignItems: "center", gap: 10,
    fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500,
  },
  checkDot: {
    width: 6, height: 6, borderRadius: "50%", background: "#fff",
    flexShrink: 0,
  },
  leftDecor1: {
    position: "absolute", width: 300, height: 300, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
    top: "-10%", right: "-15%", pointerEvents: "none",
  },
  leftDecor2: {
    position: "absolute", width: 200, height: 200, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
    bottom: "10%", left: "-5%", pointerEvents: "none",
  },

  rightPanel: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    padding: 40, background: "var(--bg)",
  },
  formWrap: { width: "100%", maxWidth: 400 },
  backBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "none", border: "none", color: "var(--text-muted)",
    fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 32,
    fontFamily: "var(--font-sans)", fontWeight: 500,
  },
  formHeader: { marginBottom: 28 },
  heading: { fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.5px", color: "var(--text-primary)" },
  subtext: { fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 },
  errorBox: {
    display: "flex", alignItems: "center", gap: 8,
    background: "var(--accent-light)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)", padding: "10px 14px",
    fontSize: 13, color: "var(--text-primary)", marginBottom: 20,
  },
  errorDot: { width: 6, height: 6, borderRadius: "50%", background: "var(--text-primary)", flexShrink: 0 },
  form: { display: "flex", flexDirection: "column", gap: 18 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" },
  input: {
    width: "100%", padding: "11px 14px",
    border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)",
    fontSize: 14, background: "var(--bg-card)", color: "var(--text-primary)",
    transition: "border-color 0.15s, box-shadow 0.15s",
    outline: "none",
  },
  inputWrap: { position: "relative" },
  eyeBtn: {
    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", color: "var(--text-faint)",
    cursor: "pointer", padding: 4, display: "flex",
  },
  btn: {
    width: "100%", padding: "12px", border: "none",
    borderRadius: "var(--radius-md)", background: "var(--accent-gradient)",
    color: "var(--btn-accent-text)", fontSize: 14, fontWeight: 600, cursor: "pointer",
    marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "opacity 0.15s, transform 0.15s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  footer: { textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--text-muted)" },
  link: {
    color: "var(--text-primary)", fontWeight: 600, cursor: "pointer",
    background: "none", border: "none", fontFamily: "var(--font-sans)", fontSize: 13,
  },
};
