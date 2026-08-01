import { useState, useEffect } from "react";
import useAuth from "../context/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, User, Briefcase, MessageSquare, ClipboardList,
  Shield, PanelLeftClose, LogOut, Zap, Settings
} from "lucide-react";
import SettingsPanel from "./SettingsPanel";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "profile", label: "Profile & CV", icon: User },
  { id: "jobs", label: "Job Hunter", icon: Briefcase },
  { id: "assistant", label: "AI Assistant", icon: MessageSquare },
  { id: "tracker", label: "Tracker", icon: ClipboardList },
  { id: "admin", label: "Admin Panel", icon: Shield, adminOnly: true },
];

const SIDEBAR_WIDTH = 240;
const COLLAPSED_WIDTH = 72;

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const page = location.pathname.split("/")[1] || "dashboard";

  // Initialize dark mode from localStorage
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const initials = (user?.full_name || user?.username || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={s.shell}>
      <aside style={{ ...s.sidebar, width: open ? SIDEBAR_WIDTH : COLLAPSED_WIDTH }}>
        {/* Header: Logo + Inline Toggle */}
        <div style={{ ...s.topRow, padding: open ? "20px 16px 16px" : "20px 0 16px", justifyContent: open ? "space-between" : "center" }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 12, cursor: !open ? "pointer" : "default" }}
            onClick={() => { if (!open) setOpen(true); }}
          >
            <div style={{ ...s.logoMark, transition: "transform 0.2s" }}
              onMouseEnter={(e) => { if (!open) e.currentTarget.style.transform = "scale(1.1)"; }}
              onMouseLeave={(e) => { if (!open) e.currentTarget.style.transform = "scale(1)"; }}
            >
              <Zap size={18} strokeWidth={2.5} />
            </div>
            <div style={{ ...s.logoText, opacity: open ? 1 : 0, width: open ? "auto" : 0 }}>
              <div style={s.logoTitle}>CareerPilot</div>
              <div style={s.logoSub}>agentic co-pilot</div>
            </div>
          </div>

          {/* Collapse button — only when expanded */}
          {open && (
            <button
              style={s.toggleBtn}
              onClick={() => setOpen(false)}
              title="Collapse sidebar"
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: open ? "0 16px 8px" : "0 12px 8px" }} />

        {/* Nav */}
        <nav style={{ ...s.navSection, padding: open ? "4px 10px" : "4px 8px" }}>
          {NAV.filter((n) => !n.adminOnly || user?.role === "admin").map((n) => {
            const active = page === n.id;
            const Icon = n.icon;
            return (
              <button
                key={n.id}
                style={s.navBtn(active, open)}
                onClick={() => navigate(`/${n.id}`)}
                title={!open ? n.label : undefined}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "var(--bg-sidebar-hover)";
                    e.currentTarget.style.color = "#fff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                  }
                }}
              >
                {active && <div style={s.navActiveDot(open)} />}
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                <span style={{ ...s.navLabel, opacity: open ? 1 : 0, width: open ? "auto" : 0 }}>{n.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ ...s.bottomSection, padding: open ? "12px 10px" : "12px 8px" }}>
          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 12 }} />

          {/* User Card — clickable to open settings */}
          <div
            style={{ ...s.userCard, padding: open ? "12px 12px" : "12px 0", justifyContent: open ? "flex-start" : "center", cursor: "pointer" }}
            onClick={() => setSettingsOpen(!settingsOpen)}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
          >
            <div style={s.avatar}>{initials}</div>
            <div style={{ ...s.userInfo, opacity: open ? 1 : 0, width: open ? "auto" : 0 }}>
              <div style={s.userName}>{user?.full_name || user?.username || "User"}</div>
              <div style={s.userEmail}>{user?.email}</div>
            </div>
            {open && (
              <Settings size={14} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0, marginLeft: "auto" }} />
            )}
          </div>

          {/* Logout */}
          <button
            style={{ ...s.logoutBtn, padding: open ? "8px 12px" : "8px 0", justifyContent: open ? "flex-start" : "center" }}
            onClick={handleLogout}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.15)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
            }}
          >
            <LogOut size={14} style={{ flexShrink: 0 }} />
            <span style={{ ...s.navLabel, opacity: open ? 1 : 0, width: open ? "auto" : 0 }}>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Settings Panel */}
      {settingsOpen && (
        <div style={{ position: "fixed", left: open ? SIDEBAR_WIDTH + 8 : COLLAPSED_WIDTH + 8, bottom: 16, zIndex: 50 }}>
          <SettingsPanel onClose={() => setSettingsOpen(false)} />
        </div>
      )}

      <main style={{ ...s.main, marginLeft: open ? SIDEBAR_WIDTH : COLLAPSED_WIDTH }}>
        {children}
      </main>
    </div>
  );
}

const s = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "var(--bg)",
    fontFamily: "var(--font-sans)",
  },
  sidebar: {
    background: "var(--bg-sidebar)",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    zIndex: 10,
    overflow: "hidden",
    transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    borderRight: "none",
    boxShadow: "2px 0 12px rgba(0,0,0,0.08)",
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    transition: "padding 0.25s",
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "var(--accent-gradient)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--btn-accent-text)",
    flexShrink: 0,
  },
  logoText: {
    overflow: "hidden",
    transition: "opacity 0.2s, width 0.25s",
    whiteSpace: "nowrap",
  },
  logoTitle: {
    fontWeight: 700,
    fontSize: 16,
    color: "#fff",
  },
  logoSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
  },
  toggleBtn: {
    background: "rgba(255,255,255,0.08)",
    border: "none",
    borderRadius: 8,
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "rgba(255,255,255,0.5)",
    transition: "all 0.2s",
    flexShrink: 0,
  },
  navSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    overflowY: "auto",
    overflowX: "hidden",
  },
  navBtn: (active, open) => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: open ? "10px 12px" : "10px 0",
    justifyContent: open ? "flex-start" : "center",
    border: "none",
    borderRadius: 8,
    background: active ? "var(--bg-sidebar-active)" : "transparent",
    color: active ? "#fff" : "rgba(255,255,255,0.65)",
    fontFamily: "var(--font-sans)",
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
    whiteSpace: "nowrap",
    overflow: "hidden",
    position: "relative",
  }),
  navLabel: {
    overflow: "hidden",
    transition: "opacity 0.15s, width 0.25s",
  },
  navActiveDot: (open) => ({
    position: "absolute",
    left: open ? 0 : "50%",
    top: open ? "50%" : 0,
    transform: open ? "none" : "translate(-50%, 0)",
    width: open ? 3 : 6,
    height: open ? 20 : 3,
    borderRadius: open ? "0 3px 3px 0" : "3px 3px 0 0",
    background: "#fff",
  }),
  bottomSection: {
    transition: "padding 0.25s",
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    background: "rgba(255,255,255,0.08)",
    marginBottom: 8,
    overflow: "hidden",
    transition: "padding 0.25s",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "rgba(255,255,255,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
    letterSpacing: "0.5px",
  },
  userInfo: {
    overflow: "hidden",
    transition: "opacity 0.15s, width 0.25s",
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontWeight: 600,
    fontSize: 13,
    color: "#fff",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  userEmail: {
    color: "rgba(255,255,255,0.45)",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    border: "none",
    borderRadius: 8,
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.6)",
    fontFamily: "var(--font-sans)",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  main: {
    flex: 1,
    padding: "32px 40px",
    minHeight: "100vh",
    transition: "margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  },
};
