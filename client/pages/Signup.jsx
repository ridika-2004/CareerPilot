import { useState } from "react";
import useAuth from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Eye, EyeOff, Loader2 } from "lucide-react";
import careerImg from "../src/assets/career.jpg";

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "", username: "", email: "", password: "", confirmPassword: "", role: "user", admin_key: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.role === "admin" && !form.admin_key) { setError("Admin secret key is required."); return; }
    setLoading(true);
    try {
      const data = await register({
        full_name: form.full_name, username: form.username, email: form.email,
        password: form.password, role: form.role, admin_key: form.admin_key,
      });
      navigate(data.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const inputProps = (field, type = "text", placeholder = "") => ({
    style: s.input, type, value: form[field], placeholder,
    onChange: (e) => setForm({ ...form, [field]: e.target.value }),
    required: true,
    onFocus: (e) => e.currentTarget.style.borderColor = "var(--border-focus)",
    onBlur: (e) => e.currentTarget.style.borderColor = "var(--border)",
  });

  return (
    <div style={s.page}>
      {/* Left */}
      <div style={s.leftPanel}>
        <div style={s.leftInner}>
          <div style={s.brandRow} className="anim-slide-left">
            <div style={s.brandIcon}><Zap size={20} strokeWidth={2.5} /></div>
            <span style={s.brandName}>CareerPilot</span>
          </div>
          <h1 style={s.heroTitle} className="anim-slide-left-d2">Start your<br /><span className="gradient-text">career journey</span> today.</h1>
          <p style={s.heroDesc} className="anim-slide-left-d3">Create an account and unlock AI-powered job hunting, application tracking, and personalized career guidance.</p>
          <div style={s.stepsList}>
            {["Upload your CV for AI analysis", "Discover matched job opportunities", "Track & manage all applications", "Get personalized career advice"].map((t, i) => (
              <div key={t} className={`anim-slide-left-d${i + 3}`} style={s.stepItem}>
                <div style={s.stepNum}>{i + 1}</div>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={s.leftDecor1} className="anim-float" />
        <div style={s.leftDecor2} className="anim-float-slow" />
      </div>

      {/* Right */}
      <div style={s.rightPanel}>
        <div style={s.formWrap} className="anim-fade-up">
          <button style={s.backBtn} onClick={() => navigate("/")}>
            <ArrowLeft size={16} /> Back to home
          </button>

          <div style={s.formHeader}>
            <h2 style={s.heading}>Create your account</h2>
            <p style={s.subtext}>Start managing your career with AI tools.</p>
          </div>

          {error && (
            <div style={s.errorBox}>
              <div style={s.errorDot} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.row2}>
              <div style={s.fieldGroup}>
                <label style={s.label}>Full Name</label>
                <input {...inputProps("full_name", "text", "John Doe")} />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Username</label>
                <input {...inputProps("username", "text", "johndoe")} />
              </div>
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Email</label>
              <input {...inputProps("email", "email", "john@example.com")} />
            </div>

            <div style={s.row2}>
              <div style={s.fieldGroup}>
                <label style={s.label}>Password</label>
                <div style={s.inputWrap}>
                  <input {...inputProps("password", showPw ? "text" : "password", "Min. 8 characters")} style={{ ...s.input, paddingRight: 40 }} />
                  <button type="button" style={s.eyeBtn} onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Confirm Password</label>
                <input {...inputProps("confirmPassword", "password", "Re-enter password")} />
              </div>
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Role</label>
              <select
                style={s.select}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {form.role === "admin" && (
              <div style={s.fieldGroup}>
                <label style={s.label}>Admin Secret Key</label>
                <input {...inputProps("admin_key", "password", "Enter admin secret key")} />
                <div style={s.hint}>Contact the system administrator to obtain the key.</div>
              </div>
            )}

            <button style={s.btn} disabled={loading}>
              {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Creating account...</> : "Create Account"}
            </button>
          </form>

          <div style={s.footer}>
            Already have an account?{" "}
            <button style={s.link} onClick={() => navigate("/login")}>Sign in</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", 
    height: "100vh", 
    overflow: "hidden",
    fontFamily: "var(--font-sans)" },
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
    // background: `linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%), url(${careerImg})`,
    // backgroundSize: "cover",
    // backgroundPosition: "center",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 48,
  },
  leftInner: { position: "relative", zIndex: 2, maxWidth: 400 },
  brandRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 40 },
  brandIcon: {
    width: 36, height: 36, borderRadius: 10, background: "var(--accent-gradient)",
    display: "flex", alignItems: "center", justifyContent: "center", color: "var(--btn-accent-text)",
  },
  brandName: { fontWeight: 700, fontSize: 18, color: "#fff", letterSpacing: "-0.3px" },
  heroTitle: { fontSize: 34, fontWeight: 800, lineHeight: 1.2, color: "#fff", letterSpacing: "-1px", marginBottom: 16 },
  heroDesc: { fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 32 },
  stepsList: { display: "flex", flexDirection: "column", gap: 14 },
  stepItem: { display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500 },
  stepNum: {
    width: 24, height: 24, borderRadius: 6, background: "rgba(255,255,255,0.12)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0,
  },
  leftDecor1: {
    position: "absolute", width: 280, height: 280, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
    top: "-8%", right: "-12%", pointerEvents: "none",
  },
  leftDecor2: {
    position: "absolute", width: 180, height: 180, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
    bottom: "8%", left: "-5%", pointerEvents: "none",
  },
  rightPanel: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    padding: 40, background: "var(--bg)", overflowY: "auto",
  },
  formWrap: { width: "100%", maxWidth: 460 },
  backBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "none", border: "none", color: "var(--text-muted)",
    fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 24,
    fontFamily: "var(--font-sans)", fontWeight: 500,
  },
  formHeader: { marginBottom: 24 },
  heading: { fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.5px", color: "var(--text-primary)" },
  subtext: { fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 },
  errorBox: {
    display: "flex", alignItems: "center", gap: 8,
    background: "var(--accent-light)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)", padding: "10px 14px",
    fontSize: 13, color: "var(--text-primary)", marginBottom: 16,
  },
  errorDot: { width: 6, height: 6, borderRadius: "50%", background: "var(--text-primary)", flexShrink: 0 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" },
  input: {
    width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)",
    borderRadius: "var(--radius-md)", fontSize: 14, background: "var(--bg-card)",
    color: "var(--text-primary)", transition: "border-color 0.15s", outline: "none",
  },
  select: {
    width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)",
    borderRadius: "var(--radius-md)", fontSize: 14, background: "var(--bg-card)",
    color: "var(--text-primary)", outline: "none", fontFamily: "var(--font-sans)",
  },
  inputWrap: { position: "relative" },
  eyeBtn: {
    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", color: "var(--text-faint)",
    cursor: "pointer", padding: 4, display: "flex",
  },
  hint: { fontSize: 11, color: "var(--text-muted)", marginTop: -2 },
  btn: {
    width: "100%", padding: "12px", border: "none",
    borderRadius: "var(--radius-md)", background: "var(--accent-gradient)",
    color: "var(--btn-accent-text)", fontSize: 14, fontWeight: 600, cursor: "pointer",
    marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  footer: { textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-muted)" },
  link: {
    color: "var(--text-primary)", fontWeight: 600, cursor: "pointer",
    background: "none", border: "none", fontFamily: "var(--font-sans)", fontSize: 13,
  },
};
