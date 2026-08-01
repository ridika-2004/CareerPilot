import { useState, useEffect, useRef } from "react";
import useAuth from "../context/useAuth";
import authService from "../services/authService";
import { X, Moon, Sun, User, Save, Loader2 } from "lucide-react";

export default function SettingsPanel({ onClose }) {
  const { user } = useAuth();
  const panelRef = useRef(null);

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.getAttribute("data-theme") === "dark";
  });

  useEffect(() => {
    const handle = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    setSaved(false);
    try {
      const data = await authService.updateProfile({
        full_name: fullName,
        username: username,
      });
      localStorage.setItem("full_name", data.full_name || "");
      localStorage.setItem("username", data.username);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={panelRef} style={s.panel} className="anim-scale-in">
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.headerIcon}><User size={14} /></div>
          <span style={s.headerTitle}>Settings</span>
        </div>
        <button style={s.closeBtn} onClick={onClose}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-elevated)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <X size={14} />
        </button>
      </div>

      {/* Dark Mode Toggle */}
      <div style={s.section}>
        <div style={s.sectionLabel}>Appearance</div>
        <button
          style={s.darkToggle}
          onClick={toggleDark}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
        >
          <div style={s.darkToggleLeft}>
            {darkMode ? <Moon size={14} style={{ color: "#a3a3a3" }} /> : <Sun size={14} style={{ color: "#737373" }} />}
            <span style={s.darkToggleLabel}>{darkMode ? "Dark Mode" : "Light Mode"}</span>
          </div>
          <div style={s.toggleTrack(darkMode)}>
            <div style={s.toggleThumb(darkMode)} />
          </div>
        </button>
      </div>

      {/* Edit Profile */}
      <div style={s.section}>
        <div style={s.sectionLabel}>Edit Profile</div>

        {error && (
          <div style={s.errorBox}>{error}</div>
        )}

        {saved && (
          <div style={s.successBox}>Profile updated successfully!</div>
        )}

        <form onSubmit={handleSave} style={s.form}>
          <div style={s.fieldGroup}>
            <label style={s.label}>Full Name</label>
            <input
              style={s.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              onFocus={(e) => e.currentTarget.style.borderColor = "var(--border-focus)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "var(--border)"}
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Username</label>
            <input
              style={s.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              onFocus={(e) => e.currentTarget.style.borderColor = "var(--border-focus)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "var(--border)"}
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Email</label>
            <input
              style={{ ...s.input, ...s.inputDisabled }}
              value={user?.email || ""}
              disabled
              title="Email cannot be changed"
            />
          </div>

          <button type="submit" style={s.saveBtn} disabled={saving}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >
            {saving ? (
              <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving...</>
            ) : (
              <><Save size={14} /> Save Changes</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  panel: {
    position: "relative",
    width: 300,
    background: "var(--bg-card)",
    border: "1px solid var(--border-light)",
    borderRadius: 14,
    boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
    overflow: "hidden",
    fontFamily: "var(--font-sans)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid var(--border-light)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "var(--accent-light)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--accent)",
  },
  headerTitle: {
    fontWeight: 600,
    fontSize: 14,
    color: "var(--text-primary)",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    borderRadius: 6,
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "var(--text-muted)",
    transition: "all 0.15s",
  },
  section: {
    padding: "16px",
    borderBottom: "1px solid var(--border-light)",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: 12,
  },
  darkToggle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "10px 12px",
    border: "1px solid var(--border)",
    borderRadius: 10,
    background: "var(--bg-elevated)",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "var(--font-sans)",
  },
  darkToggleLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  darkToggleLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-primary)",
  },
  toggleTrack: (dark) => ({
    width: 36,
    height: 20,
    borderRadius: 10,
    background: dark ? "#ffffff" : "#d4d4d4",
    position: "relative",
    transition: "background 0.2s",
  }),
  toggleThumb: (dark) => ({
    width: 16,
    height: 16,
    borderRadius: "50%",
    background: dark ? "#121212" : "#fff",
    position: "absolute",
    top: 2,
    left: dark ? 18 : 2,
    transition: "left 0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  }),
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    border: "1.5px solid var(--border)",
    borderRadius: 8,
    fontSize: 13,
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    outline: "none",
    transition: "border-color 0.15s",
  },
  inputDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  errorBox: {
    padding: "8px 12px",
    borderRadius: 8,
    background: "var(--danger-light)",
    color: "var(--danger)",
    fontSize: 12,
    marginBottom: 8,
  },
  successBox: {
    padding: "8px 12px",
    borderRadius: 8,
    background: "var(--success-light)",
    color: "var(--success)",
    fontSize: 12,
    marginBottom: 8,
  },
  saveBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "10px",
    border: "none",
    borderRadius: 8,
    background: "var(--accent-gradient)",
    color: "var(--btn-accent-text)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
    transition: "opacity 0.15s",
  },
};
