const NAV = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "jobs", label: "Job Hunter", icon: "🔍" },
  { id: "assistant", label: "Assistant", icon: "🤖" },
  { id: "tracker", label: "Tracker", icon: "📋" },
  { id: "profile", label: "Profile", icon: "👤" },
];

const s = {
  shell: { display: "flex", height: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: "#f7f6f3", color: "#1a1a1a", fontSize: 14 },
  sidebar: { width: 200, background: "#fff", borderRight: "1px solid #e5e5e5", display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0 },
  logo: { padding: "0 20px 24px", fontWeight: 700, fontSize: 17, letterSpacing: "-0.5px", borderBottom: "1px solid #e5e5e5", marginBottom: 16, fontFamily: "'Inter', system-ui, sans-serif" },
  logoSub: { fontSize: 10, fontWeight: 400, color: "#999", display: "block", marginTop: 3 },
  navBtn: (active) => ({
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", textAlign: "left", padding: "10px 20px",
    border: "none", background: active ? "#f0efe9" : "transparent",
    color: active ? "#1a1a1a" : "#666", cursor: "pointer",
    fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13,
    fontWeight: active ? 600 : 400,
    borderLeft: active ? "2px solid #1a1a1a" : "2px solid transparent",
    transition: "all 0.12s",
  }),
  main: { flex: 1, overflow: "auto", padding: "32px 40px" },
};

export default function Layout({ page, setPage, children }) {
  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.logo}>
          CareerPilot
          <span style={s.logoSub}>agentic co-pilot</span>
        </div>
        {NAV.map((n) => (
          <button key={n.id} style={s.navBtn(page === n.id)} onClick={() => setPage(n.id)}>
            <span style={{ fontSize: 15 }}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </aside>
      <main style={s.main}>{children}</main>
    </div>
  );
}
