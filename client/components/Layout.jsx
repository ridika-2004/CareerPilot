import useAuth from "../context/useAuth";

const NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "profile", label: "Profile" },
  { id: "jobs", label: "Job Hunter" },
  { id: "assistant", label: "Assistant" },
  { id: "tracker", label: "Tracker" },
];

const s = {
  shell: { display: "flex", height: "100vh", fontFamily: "'Roboto Mono', monospace", background: "#f7f6f3", color: "#1a1a1a", fontSize: 14 },
  sidebar: { width: 200, background: "#fff", borderRight: "1px solid #e5e5e5", display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0 },
  logo: { padding: "0 20px 24px", fontWeight: 700, fontSize: 17, letterSpacing: "-0.5px", borderBottom: "1px solid #e5e5e5", marginBottom: 16, fontFamily: "'Roboto Mono', monospace" },
  logoSub: { fontSize: 10, fontWeight: 400, color: "#999", display: "block", marginTop: 3 },
  navBtn: (active) => ({
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", textAlign: "left", padding: "10px 20px",
    border: "none", background: active ? "#f5f5f5" : "transparent",
    color: active ? "#1a1a1a" : "#666", cursor: "pointer",
    fontFamily: "'Roboto Mono', monospace", fontSize: 13,
    fontWeight: active ? 600 : 400,
    borderLeft: active ? "2px solid #1a1a1a" : "2px solid transparent",
    transition: "all 0.12s",
  }),
  main: { flex: 1, overflow: "auto", padding: "32px 40px" },
  spacer: { flex: 1 },
  userInfo: {
    padding: "16px 20px",
    borderTop: "1px solid #e5e5e5",
    fontSize: 12,
    color: "#888",
  },
  userName: {
    fontWeight: 600,
    color: "#1a1a1a",
    fontSize: 13,
    marginBottom: 2,
  },
  logoutBtn: {
    background: "none",
    border: "none",
    color: "#999",
    cursor: "pointer",
    fontSize: 11,
    fontFamily: "'Roboto Mono', monospace",
    padding: 0,
    textDecoration: "underline",
    marginTop: 6,
  },
};

export default function Layout({ page, setPage, children }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setPage("landing");
  };

  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.logo}>
          CareerPilot
          <span style={s.logoSub}>agentic co-pilot</span>
        </div>
        {NAV.map((n) => (
          <button key={n.id} style={s.navBtn(page === n.id)} onClick={() => setPage(n.id)}>
            {n.label}
          </button>
        ))}
        <div style={s.spacer} />
        <div style={s.userInfo}>
          <div style={s.userName}>{user?.full_name || user?.username || "User"}</div>
          <div style={{ color: "#aaa", fontSize: 11 }}>{user?.email}</div>
          <button style={s.logoutBtn} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>
      <main style={s.main}>{children}</main>
    </div>
  );
}
