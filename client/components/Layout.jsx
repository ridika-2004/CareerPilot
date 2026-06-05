import useAuth from "../context/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

const NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "profile", label: "Profile" },
  { id: "jobs", label: "Job Hunter" },
  { id: "assistant", label: "Assistant" },
  { id: "tracker", label: "Tracker" },
  { id: "admin", label: "Admin Panel", adminOnly: true },
];

const s = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#f7f6f3",
    fontFamily: "'Roboto Mono', monospace",
  },
  sidebar: {
    width: 220,
    background: "#fff",
    borderRight: "1px solid #e5e5e5",
    display: "flex",
    flexDirection: "column",
    padding: "24px 0 16px",
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    zIndex: 10,
  },
  logo: {
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: "-0.5px",
    padding: "0 20px 24px",
    color: "#1a1a1a",
    display: "flex",
    flexDirection: "column",
  },
  logoSub: {
    fontSize: 10,
    fontWeight: 400,
    color: "#aaa",
    marginTop: 2,
  },
  navBtn: (active) => ({
    width: "100%",
    textAlign: "left",
    padding: "10px 20px",
    border: "none",
    background: active ? "#f4f3ef" : "transparent",
    color: active ? "#1a1a1a" : "#666",
    fontFamily: "'Roboto Mono', monospace",
    fontSize: 13,
    fontWeight: active ? 700 : 400,
    cursor: "pointer",
    borderLeft: active ? "2px solid #1a1a1a" : "2px solid transparent",
    transition: "background 0.15s, color 0.15s",
  }),
  spacer: { flex: 1 },
  userInfo: {
    padding: "16px 20px 0",
    borderTop: "1px solid #f0f0f0",
  },
  userName: {
    fontWeight: 600,
    fontSize: 13,
    color: "#1a1a1a",
    marginBottom: 2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    marginTop: 10,
    border: "1px solid #e5e5e5",
    borderRadius: 5,
    padding: "6px 12px",
    background: "none",
    color: "#888",
    fontFamily: "'Roboto Mono', monospace",
    fontSize: 11,
    cursor: "pointer",
  },
  main: {
    marginLeft: 220,
    flex: 1,
    padding: "36px 40px",
    minHeight: "100vh",
  },
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const page = location.pathname.split("/")[1] || "dashboard";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.logo}>
          CareerPilot
          <span style={s.logoSub}>agentic co-pilot</span>
        </div>

        {NAV.filter((n) => !n.adminOnly || user?.role === "admin").map((n) => (
          <button
            key={n.id}
            style={s.navBtn(page === n.id)}
            onClick={() => navigate(`/${n.id}`)}
          >
            {n.label}
          </button>
        ))}

        <div style={s.spacer} />

        <div style={s.userInfo}>
          <div style={s.userName}>
            {user?.full_name || user?.username || "User"}
          </div>

          <div style={{ color: "#aaa", fontSize: 11 }}>
            {user?.email}
          </div>

          <button style={s.logoutBtn} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main style={s.main}>{children}</main>
    </div>
  );
}