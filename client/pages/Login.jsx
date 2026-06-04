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
    maxWidth: 400,
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

export default function Login({ onNavigate }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      onNavigate("dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <button style={s.backLink} onClick={() => onNavigate("landing")}>
        Back to home
      </button>
      <div style={s.card}>
        <div style={s.logo}>CareerPilot</div>
        <div style={s.logoSub}>agentic co-pilot</div>

        <div style={s.heading}>Welcome back</div>
        <div style={s.subtext}>Sign in to continue to your dashboard.</div>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={s.label}>Username</label>
          <input
            style={s.input}
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Enter your username"
            onFocus={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.background = "#fff"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#ddd"; e.currentTarget.style.background = "#fafafa"; }}
            required
          />

          <label style={s.label}>Password</label>
          <input
            style={s.input}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Enter your password"
            onFocus={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.background = "#fff"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#ddd"; e.currentTarget.style.background = "#fafafa"; }}
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
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={s.footer}>
          Don't have an account?{" "}
          <button style={s.link} onClick={() => onNavigate("signup")}>
            Create one
          </button>
        </div>
      </div>
    </div>
  );
}
