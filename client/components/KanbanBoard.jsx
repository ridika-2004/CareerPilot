import { useState, useEffect } from "react";
import useAuth from "../context/useAuth";
import api from "../src/api";
import { Mail, Loader2, Sparkles, Plus, Trash2 } from "lucide-react";

const COLS = ["Applied", "Interviewing", "Offer", "Rejected"];
const colAccent = {
  Applied: { dot: "#1a1a1a", bg: "var(--bg-elevated)" },
  Interviewing: { dot: "#555555", bg: "var(--bg-elevated)" },
  Offer: { dot: "#888888", bg: "var(--bg-elevated)" },
  Rejected: { dot: "#bbbbbb", bg: "var(--bg-elevated)" },
};

export default function KanbanBoard() {
  const { user } = useAuth();
  const userId = user?.user_id?.toString() || "";
  const [items, setItems] = useState([]);
  const [adding, setAdding] = useState(null);
  const [form, setForm] = useState({ role: "", company: "", description: "", requirements: [], source_url: "" });
  const [loading, setLoading] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const [gmailStatus, setGmailStatus] = useState({ connected: false, configured: false });
  const [scanning, setScanning] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try { const res = await api.get(`/api/tracker/applications/?user_id=${userId}`); setItems(res.data.map(item => ({ ...item, col: item.status }))); }
    catch (err) { console.error("Error fetching applications:", err); }
    finally { setLoading(false); }
  };

  const showToast = (msg, duration = 5000) => { setToast(msg); setTimeout(() => setToast(null), duration); };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const res = await api.get(`/api/tracker/applications/?user_id=${userId}`); setItems(res.data.map(item => ({ ...item, col: item.status }))); }
      catch (err) { console.error("Error fetching applications:", err); }
      finally { setLoading(false); }

      if (userId) {
        try { const res = await api.get(`/api/gmail/status/?user_id=${userId}`); setGmailStatus(res.data); }
        catch (err) { console.error("Error checking Gmail status", err); }
      }
    })();

    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail_connected')) {
      setTimeout(() => showToast("Gmail connected successfully! You can now scan for updates."), 0);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [userId]);

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true); setScrapeError("");
    try {
      const res = await api.post(`/api/tracker/scrape-job/`, { url: scrapeUrl });
      const data = res.data;
      setForm({ role: data.role || "", company: data.company || "", description: data.description || "", requirements: data.requirements || [], source_url: data.source_url || scrapeUrl });
      if (data.warning) setScrapeError(data.warning);
    } catch (err) { setScrapeError(err.response?.data?.error || "Failed to parse job URL."); }
    finally { setScraping(false); }
  };

  const add = async (col) => {
    if (!form.role || !form.company) return;
    try {
      const payload = { user_id: userId, status: col, ...form };
      const res = await api.post(`/api/tracker/applications/`, payload);
      setItems([{ ...res.data, col: res.data.status }, ...items]);
      setAdding(null); setForm({ role: "", company: "", description: "", requirements: [], source_url: "" }); setScrapeUrl(""); setScrapeError("");
    } catch (err) { console.error("Error adding application:", err); }
  };

  const moveCard = async (id, newCol) => {
    const card = items.find(i => i.id === id); if (!card) return;
    try {
      await api.put(`/api/tracker/applications/${id}/`, { user_id: userId, role: card.role, company: card.company, status: newCol });
      setItems(items.map(item => item.id === id ? { ...item, col: newCol, status: newCol } : item));
    } catch (err) { console.error("Error moving application:", err); }
  };

  const removeCard = async (id) => {
    try { await api.delete(`/api/tracker/applications/${id}/?user_id=${userId}`); setItems(items.filter(item => item.id !== id)); }
    catch (err) { console.error("Error deleting application:", err); }
  };

  const handleGmailClick = async () => {
    if (!gmailStatus.connected) {
      try { const res = await api.get(`/api/gmail/auth-url/?user_id=${userId}`); window.location.href = res.data.auth_url; }
      catch (err) { alert(err.response?.data?.error || "Error connecting to Gmail"); }
      return;
    }
    setScanning(true);
    try {
      const res = await api.post(`/api/gmail/scan/`, { user_id: userId });
      const { actions, message } = res.data;
      if (actions && actions.length > 0) {
        fetchItems();
        const moved = actions.filter(a => a.changed);
        if (moved.length > 0) {
          const m = moved[0]; let txt = `Moved ${m.company} to ${m.new_status}!`;
          if (m.supportive_message) txt += `\n\n${m.supportive_message}`;
          if (moved.length > 1) txt += `\n(+ ${moved.length - 1} more updates)`;
          showToast(txt, 8000);
        } else { showToast("Scanned emails, but no status changes needed."); }
      } else { showToast(message || "No relevant job emails found."); }
    } catch (err) {
      if (err.response?.data?.connect_required) { setGmailStatus({ ...gmailStatus, connected: false }); alert("Gmail token expired. Please reconnect."); }
      else { alert(err.response?.data?.error || "Error scanning Gmail"); }
    } finally { setScanning(false); }
  };

  return (
    <div>
      {toast && <div style={s.toast} className="anim-slide-right"><div style={{ whiteSpace: "pre-line" }}>{toast}</div></div>}

      <div style={s.header}>
        <div style={s.headerTitle}>Active Applications</div>
        <button style={s.gmailBtn(gmailStatus.connected)} onClick={handleGmailClick} disabled={scanning}>
          {scanning ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Scanning...</> : (
            <><Mail size={14} /> {gmailStatus.connected ? "Scan Gmail Updates" : "Connect Gmail"}</>
          )}
        </button>
      </div>

      <div style={s.board}>
        {COLS.map((col) => (
          <div key={col} style={s.col}>
            <div style={s.colHead}>
              <div style={s.colDot(colAccent[col].dot)} />
              {col}
              <span style={s.colCount}>{items.filter(i => i.col === col).length}</span>
            </div>

            {loading && items.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "center", padding: "20px 0" }}>Loading...</div>
            ) : (
              items.filter(i => i.col === col).map((item) => (
                <div key={item.id} style={s.card}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "var(--shadow-sm)"}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                >
                  <button style={s.deleteBtn} onClick={() => removeCard(item.id)}><Trash2 size={12} /></button>
                  <div style={s.cardRole}>{item.role}</div>
                  <div style={s.cardCo}>{item.company}</div>
                  {item.description && <div style={s.cardDesc}>{item.description}</div>}
                  <div style={s.cardBottom}>
                    <span style={s.cardDate}>{item.date}</span>
                    <select value={item.col} onChange={(e) => moveCard(item.id, e.target.value)} style={s.select}>
                      {COLS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              ))
            )}

            {adding === col ? (
              <div style={s.addCard}>
                <div style={s.scrapeBox}>
                  <div style={s.scrapeLabel}><Sparkles size={11} /> AI AUTO-FILL</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <input placeholder="Paste job URL" value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} style={{ ...s.input, marginBottom: 0, flex: 1 }} />
                    <button onClick={handleScrape} disabled={scraping || !scrapeUrl} style={s.scrapeBtn}>
                      {scraping ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : "Go"}
                    </button>
                  </div>
                  {scrapeError && <div style={s.scrapeErr}>{scrapeError}</div>}
                </div>
                <input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={s.input} />
                <input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} style={s.input} />
                {form.description && <div style={s.jdSummary}><strong>Summary:</strong> {form.description}</div>}
                <div style={s.addBtnRow}>
                  <button onClick={() => add(col)} style={s.primaryBtn}>Add to {col}</button>
                  <button onClick={() => { setAdding(null); setScrapeError(""); setForm({role:"", company:"", description:"", requirements:[], source_url:""}); }} style={s.ghostBtn}>Cancel</button>
                </div>
              </div>
            ) : (
              <button style={s.addBtn} onClick={() => setAdding(col)}>
                <Plus size={14} /> Add Application
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  headerTitle: { fontSize: 16, fontWeight: 600, color: "var(--text-primary)" },
  gmailBtn: (connected) => ({
    display: "flex", alignItems: "center", gap: 8,
    background: connected ? "var(--success-light)" : "var(--bg-card)",
    border: `1px solid ${connected ? "var(--success)" : "var(--border)"}`,
    color: connected ? "var(--success)" : "var(--text-secondary)",
    padding: "7px 14px", borderRadius: "var(--radius-md)", fontSize: 13,
    cursor: "pointer", fontWeight: 500, fontFamily: "var(--font-sans)",
    transition: "all 0.15s",
  }),
  board: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 },
  col: { background: "var(--bg-elevated)", borderRadius: "var(--radius-lg)", padding: 14, minHeight: 320 },
  colHead: { display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", marginBottom: 12 },
  colDot: (color) => ({ width: 8, height: 8, borderRadius: "50%", background: color }),
  colCount: { fontSize: 11, color: "var(--text-faint)", fontWeight: 500, marginLeft: "auto" },
  card: {
    background: "var(--bg-card)", border: "1px solid var(--border-light)",
    borderRadius: "var(--radius-md)", padding: "12px 14px", marginBottom: 8,
    position: "relative", transition: "box-shadow 0.15s",
  },
  deleteBtn: { position: "absolute", top: 8, right: 8, background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", display: "flex", padding: 2 },
  cardRole: { fontWeight: 600, fontSize: 13, paddingRight: 20, color: "var(--text-primary)" },
  cardCo: { color: "var(--text-muted)", fontSize: 12, marginTop: 2 },
  cardDesc: { color: "var(--text-secondary)", fontSize: 11, marginTop: 6, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  cardBottom: { marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardDate: { color: "var(--text-faint)", fontSize: 11 },
  select: { border: "1px solid var(--border-light)", borderRadius: 4, fontSize: 10, padding: "2px 4px", background: "var(--bg-elevated)", cursor: "pointer", color: "var(--text-muted)", outline: "none", fontFamily: "var(--font-sans)" },

  addBtn: {
    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    background: "none", border: "1.5px dashed var(--border)",
    borderRadius: "var(--radius-md)", padding: "8px 0",
    color: "var(--text-faint)", cursor: "pointer", fontSize: 12,
    fontFamily: "var(--font-sans)", fontWeight: 500, transition: "all 0.15s",
  },
  addCard: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 12, marginBottom: 8 },
  scrapeBox: { background: "var(--accent-light)", border: "1px solid var(--border)", padding: 10, borderRadius: 8, marginBottom: 10 },
  scrapeLabel: { fontSize: 10, color: "var(--accent)", marginBottom: 6, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, letterSpacing: "0.3px" },
  input: { width: "100%", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", fontSize: 12, marginBottom: 6, boxSizing: "border-box", outline: "none", fontFamily: "var(--font-sans)", background: "var(--bg-card)", color: "var(--text-primary)" },
  scrapeBtn: { fontSize: 11, cursor: "pointer", border: "none", borderRadius: 6, padding: "6px 12px", background: "var(--accent)", color: "var(--btn-accent-text)", flex: "none", fontWeight: 600, fontFamily: "var(--font-sans)", display: "flex", alignItems: "center" },
  scrapeErr: { fontSize: 10, color: "var(--warning)", marginTop: 4 },
  jdSummary: { fontSize: 10, color: "var(--text-secondary)", background: "var(--success-light)", border: "1px solid rgba(34,197,94,0.15)", padding: 8, borderRadius: 6, marginBottom: 6, maxHeight: 60, overflowY: "auto", lineHeight: 1.4 },
  addBtnRow: { display: "flex", gap: 6, marginTop: 4 },
  primaryBtn: { fontSize: 11, cursor: "pointer", border: "none", borderRadius: 6, padding: "6px 14px", background: "var(--accent-gradient)", color: "var(--btn-accent-text)", flex: 1, fontWeight: 600, fontFamily: "var(--font-sans)" },
  ghostBtn: { fontSize: 11, cursor: "pointer", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 14px", background: "var(--bg-card)", color: "var(--text-secondary)", fontFamily: "var(--font-sans)" },

  toast: { position: "fixed", bottom: 20, right: 20, background: "var(--accent)", color: "var(--btn-accent-text)", padding: "14px 18px", borderRadius: "var(--radius-lg)", fontSize: 13, boxShadow: "var(--shadow-xl)", zIndex: 100, maxWidth: 320, lineHeight: 1.5 },
};
