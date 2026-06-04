import { useState } from "react";
import useAuth from "../context/useAuth";

const s = {
  page: {
    fontFamily: "'Roboto Mono', monospace",
    background: "#f7f6f3",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: 10,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
  },
  logo: {
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: "-0.5px",
    marginBottom: 4,
    textAlign: "center",
  },
  logoSub: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
    marginBottom: 32,
  },
  heading: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 6,
    color: "#111",
  },
  subtext: {
    fontSize: 13,
    color: "#888",
    marginBottom: 28,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    color: "#555",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 13,
    fontFamily: "'Roboto Mono', monospace",
    marginBottom: 18,
    outline: "none",
    transition: "border-color 0.15s",
    background: "#fafafa",
  },
  btn: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: 6,
    background: "#1a1a1a",
    color: "#fff",
    fontFamily: "'Roboto Mono', monospace",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s",
    marginTop: 8,
  },
  error: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 6,
    padding: "10px 12px",
    fontSize: 12,
    color: "#b91c1c",
    marginBottom: 16,
  },
  footer: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 12,
    color: "#888",
  },
  link: {
    color: "#1a1a1a",
    fontWeight: 600,
    cursor: "pointer",
    background: "none",
    border: "none",
    textDecoration: "underline",
    fontFamily: "'Roboto Mono', monospace",
    fontSize: 12,
    padding: 0,
  },
  backLink: {
    position: "absolute",
    top: 24,
    left: 32,
    fontSize: 12,
    color: "#999",
    cursor: "pointer",
    background: "none",
    border: "none",
    fontFamily: "'Roboto Mono', monospace",
    textDecoration: "none",
  },
};

export default function Signup({ onNavigate }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: form.full_name,
        username: form.username,
        email: form.email,
        password: form.password,
      });
      onNavigate("dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputFocus = (e) => {
    e.currentTarget.style.borderColor = "#1a1a1a";
    e.currentTarget.style.background = "#fff";
  };
  const inputBlur = (e) => {
    e.currentTarget.style.borderColor = "#ddd";
    e.currentTarget.style.background = "#fafafa";
  };

  return (
    <div style={s.page}>
      <button style={s.backLink} onClick={() => onNavigate("landing")}>
        Back to home
      </button>
      <div style={s.card}>
        <div style={s.logo}>CareerPilot</div>
        <div style={s.logoSub}>agentic co-pilot</div>

        <div style={s.heading}>Create your account</div>
        <div style={s.subtext}>Start managing your career with AI-powered tools.</div>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={s.label}>Full Name</label>
          <input
            style={s.input}
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Your full name"
            onFocus={inputFocus}
            onBlur={inputBlur}
            required
          />

          <label style={s.label}>Username</label>
          <input
            style={s.input}
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Choose a username"
            onFocus={inputFocus}
            onBlur={inputBlur}
            required
          />

          <label style={s.label}>Email</label>
          <input
            style={s.input}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            onFocus={inputFocus}
            onBlur={inputBlur}
            required
          />

          <label style={s.label}>Password</label>
          <input
            style={s.input}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 8 characters"
            onFocus={inputFocus}
            onBlur={inputBlur}
            required
          />

          <label style={s.label}>Confirm Password</label>
          <input
            style={s.input}
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="Repeat your password"
            onFocus={inputFocus}
            onBlur={inputBlur}
            required
          />

          <button
            type="submit"
            style={{
              ...s.btn,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#333"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#1a1a1a"; }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div style={s.footer}>
          Already have an account?{" "}
          <button style={s.link} onClick={() => onNavigate("login")}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
