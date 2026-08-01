import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import API_URL from "../src/config";
import useAuth from "../context/useAuth";
import { Plus, Pencil, Trash2, Send, MessageSquare, AlertCircle, Loader2 } from "lucide-react";

const API = `${API_URL}/api/assistant`;

const SUGGESTIONS = [
  "Am I ready for a data engineer role?",
  "What skills am I missing for a Google internship?",
  "Build me a 3-month roadmap to become job-ready",
  "Draft a cover letter for a backend engineer role",
];

function TypingIndicator() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%", background: "var(--text-faint)",
          display: "inline-block", animation: `bounce-dot 1.2s ${i * 0.2}s infinite`,
        }} />
      ))}
    </span>
  );
}

export default function Assistant() {
  const { user } = useAuth();
  const userId = user?.user_id?.toString() || "anonymous";
  const cvUploadedKey = `cv_uploaded_${userId}`;

  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cvUploaded] = useState(() => localStorage.getItem(cvUploadedKey) === "true");
  const chatAreaRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/sessions/?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((s) => ({ id: s.id, title: s.title, messages: [] }));
        setSessions(mapped);
        if (mapped.length) setActiveId(mapped[0].id);
      });
  }, [userId]);

  useEffect(() => {
    if (!activeId) return;
    const session = sessions.find((s) => s.id === activeId);
    if (session && session.messages.length > 0) return;
    fetch(`${API}/sessions/${activeId}/`)
      .then((res) => res.json())
      .then((data) => {
        setSessions((prev) => prev.map((s) => s.id === activeId ? { ...s, messages: data.messages || [] } : s));
      })
      .catch((err) => console.error("Failed to load session:", err));
  }, [activeId]);

  const createSession = async () => {
    const res = await fetch(`${API}/sessions/create/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json();
    const ns = { id: data.id, title: data.title, messages: [] };
    setSessions((prev) => [ns, ...prev]);
    setActiveId(ns.id);
  };

  const renameSession = async (id) => {
    const current = sessions.find((s) => s.id === id);
    const title = prompt("Rename chat", current?.title || "");
    if (!title?.trim()) return;
    await fetch(`${API}/sessions/${id}/rename/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, title } : s));
  };

  const deleteSession = async (id) => {
    await fetch(`${API}/sessions/${id}/delete/`, { method: "POST" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      setActiveId(remaining[0]?.id || null);
    }
  };

  const send = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    let sessionId = activeId;
    if (!sessionId) {
      const res = await fetch(`${API}/sessions/create/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      sessionId = data.id;
      setSessions((prev) => [{ id: data.id, title: data.title, messages: [] }, ...prev]);
      setActiveId(sessionId);
    }
    setInput("");
    setLoading(true);
    setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, messages: [...s.messages, { role: "user", content: msg }] } : s));
    try {
      const res = await fetch(`${API}/chat/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: msg, user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) { console.error(data.error); return; }
      setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, messages: [...s.messages, data.message] } : s));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (chatAreaRef.current) chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
  }, [sessions, loading]);

  const activeSession = sessions.find((sess) => sess.id === activeId);

  return (
    <div style={s.container} className="anim-fade-up">
      {/* Sidebar */}
      <div style={s.sidebar}>
        <button style={s.newChatBtn} onClick={createSession}>
          <Plus size={16} strokeWidth={2} /> New Chat
        </button>
        <div style={s.sessionList}>
          {sessions.map((sesh) => (
            <div key={sesh.id} style={s.sessionItem(sesh.id === activeId)}
              onClick={() => setActiveId(sesh.id)}
              onMouseEnter={(e) => { if (sesh.id !== activeId) e.currentTarget.style.background = "var(--bg-elevated)"; }}
              onMouseLeave={(e) => { if (sesh.id !== activeId) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={s.sessionTitle}>{sesh.title}</div>
              <div style={s.sessionActions}>
                <button style={s.iconBtn} onClick={(e) => { e.stopPropagation(); renameSession(sesh.id); }} title="Rename">
                  <Pencil size={12} />
                </button>
                <button style={s.iconBtn} onClick={(e) => { e.stopPropagation(); deleteSession(sesh.id); }} title="Delete">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        <div style={s.header}>
          {/* <h1 style={s.h1}>AI Assistant</h1> */}
          <p style={s.sub}>Ask anything about your career</p>
        </div>

        {!cvUploaded && (
          <div style={s.cvBanner}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>No CV uploaded yet. Grounded career analysis requires a CV upload on the Profile page.</span>
          </div>
        )}

        <div ref={chatAreaRef} style={s.chatArea}>
          {(!activeSession || activeSession.messages.length === 0) && (
            <div style={s.emptyChat}>
              <div style={s.emptyChatIcon}>
                <MessageSquare size={24} />
              </div>
              <div style={s.emptyChatTitle}>Start a conversation</div>
              <div style={s.emptyChatDesc}>Ask a question or try a suggestion below</div>
              <div style={s.suggestions}>
                {SUGGESTIONS.map((q) => (
                  <button key={q} style={s.suggBtn} onClick={() => send(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSession?.messages.map((m, i) => (
            <div key={i} style={s.msg(m.role)}>
              <div style={s.bubble(m.role)}>
                {m.role === "assistant" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                ) : m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={s.msg("assistant")}>
              <div style={s.bubble("assistant")}>
                <TypingIndicator />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={s.inputRow}>
          <input
            style={s.inputField}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message..."
          />
          <button style={s.sendBtn} onClick={() => send()} disabled={loading}>
            {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  container: {
    display: "flex", height: "85vh", width: "100%",
    // border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
    overflow: "hidden", background: "var(--bg)",
    // boxShadow: "var(--shadow-sm)",
  },
  sidebar: {
    width: 260, borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", background: "var(--bg)",
  },
  newChatBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    margin: 12, padding: "10px 12px",
    border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
    background: "var(--bg-card)", cursor: "pointer", fontSize: 13,
    fontWeight: 600, color: "var(--text-secondary)",
    fontFamily: "var(--font-sans)", transition: "all 0.15s",
  },
  sessionList: { flex: 1, overflowY: "auto" },
  sessionItem: (active) => ({
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 12px", margin: "2px 6px", borderRadius: 8,
    cursor: "pointer", background: active ? "var(--bg-card)" : "transparent",
    fontSize: 13, transition: "background 0.15s",
    boxShadow: active ? "var(--shadow-xs)" : "none",
  }),
  sessionTitle: {
    flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    color: "var(--text-secondary)", fontWeight: 500,
  },
  sessionActions: { display: "flex", gap: 2, opacity: 0.5 },
  iconBtn: {
    border: "none", background: "transparent", cursor: "pointer",
    padding: 4, color: "var(--text-muted)", display: "flex",
    borderRadius: 4, transition: "color 0.15s",
  },
  main: { flex: 1, display: "flex", flexDirection: "column", background: "transparent", },
  header: { padding: "16px 20px", borderBottom: "transparent" },
  h1: { fontSize: 18, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.3px" },
  sub: { fontSize: 13, color: "var(--text-muted)" },
  cvBanner: {
    display: "flex", alignItems: "flex-start", gap: 8,
    background: "var(--warning-light)", border: "1px solid #fde68a",
    borderRadius: "var(--radius-md)", padding: "10px 14px",
    margin: "12px 16px 0", fontSize: 13, color: "#92400e", lineHeight: 1.5,
  },
  chatArea: { flex: 1, overflowY: "auto", padding: "16px 20px" },
  emptyChat: { textAlign: "center", paddingTop: 40 },
  emptyChatIcon: {
    width: 48, height: 48, borderRadius: 14, background: "var(--accent-light)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--accent)", margin: "0 auto 14px",
  },
  emptyChatTitle: { fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 },
  emptyChatDesc: { fontSize: 13, color: "var(--text-muted)", marginBottom: 20 },
  msg: (role) => ({
    display: "flex", justifyContent: role === "user" ? "flex-end" : "flex-start",
    marginBottom: 12,
  }),
  bubble: (role) => ({
    maxWidth: "72%", padding: "12px 16px",
    borderRadius: role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
    background: role === "user" ? "var(--accent-gradient)" : "var(--bg-elevated)",
    color: role === "user" ? "var(--btn-accent-text)" : "var(--text-primary)",
    fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap",
    boxShadow: role === "user" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
  }),
  inputRow: {
    display: "flex", gap: 8, padding: "12px 16px",
    borderTop: "1px solid var(--border)", background: "transparent",
  },
  inputField: {
    flex: 1, padding: "11px 14px", border: "1.5px solid var(--border)",
    borderRadius: "var(--radius-md)", fontSize: 14, fontFamily: "var(--font-sans)",
    outline: "none", background: "var(--bg-input)", color: "var(--text-primary)",
    transition: "border-color 0.15s",
  },
  sendBtn: {
    width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center",
    border: "none", borderRadius: "var(--radius-md)",
    background: "var(--accent-gradient)", color: "var(--btn-accent-text)",
    cursor: "pointer", flexShrink: 0,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  suggestions: { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", padding: "0 20px" },
  suggBtn: {
    padding: "8px 14px", border: "1px solid var(--border)",
    borderRadius: "var(--radius-full)", background: "var(--bg-card)",
    cursor: "pointer", fontSize: 12, color: "var(--text-secondary)",
    fontFamily: "var(--font-sans)", fontWeight: 500,
    transition: "all 0.15s",
  },
};
