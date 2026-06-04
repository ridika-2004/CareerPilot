const NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "jobs", label: "Job Hunter" },
  { id: "assistant", label: "Assistant" },
  { id: "tracker", label: "Tracker" },
  { id: "profile", label: "Profile" },
];

const s = {
  shell: { display: "flex", height: "100vh", fontFamily: "'DM Mono', monospace", background: "#f7f6f3", color: "#1a1a1a", fontSize: 14 },
  sidebar: { width: 180, background: "#fff", borderRight: "1px solid #e5e5e5", display: "flex", flexDirection: "column", padding: "24px 0" },
  logo: { padding: "0 20px 24px", fontWeight: 700, fontSize: 16, letterSpacing: "-0.5px", borderBottom: "1px solid #e5e5e5", marginBottom: 16 },
  logoSub: { fontSize: 10, fontWeight: 400, color: "#999", display: "block", marginTop: 2 },
  navBtn: (active) => ({ display: "block", width: "100%", textAlign: "left", padding: "9px 20px", border: "none", background: active ? "#f0efe9" : "transparent", color: active ? "#1a1a1a" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: active ? 600 : 400, borderLeft: active ? "2px solid #1a1a1a" : "2px solid transparent" }),
  main: { flex: 1, overflow: "auto", padding: 32 },
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
            {n.label}
          </button>
        ))}
      </aside>
      <main style={s.main}>{children}</main>
    </div>
  );
}
