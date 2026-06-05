import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import API_URL from "../src/config";
import useAuth from "../context/useAuth";

const API = `${API_URL}/api/assistant`;

const SUGGESTIONS = [
  "Am I ready for a data engineer role?",
  "What skills am I missing for a Google internship?",
  "Build me a 3-month roadmap to become job-ready",
  "Draft a cover letter for a backend engineer role",
];

const s = {
  container: {
    display: "flex",
    height: "80vh",
    border: "1px solid #e5e5e5",
    borderRadius: 8,
    overflow: "hidden",
    background: "#fff",
  },

  sidebar: {
    width: 260,
    borderRight: "1px solid #e5e5e5",
    display: "flex",
    flexDirection: "column",
    background: "#fafafa",
  },

  newChatBtn: {
    margin: 12,
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 6,
    background: "#fff",
    cursor: "pointer",
    fontSize: 13,
  },

  sessionList: {
    flex: 1,
    overflowY: "auto",
  },

  sessionItem: (active) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    borderBottom: "1px solid #eee",
    cursor: "pointer",
    background: active ? "#f0f0f0" : "transparent",
    fontSize: 13,
  }),

  sessionTitle: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  iconBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 13,
    marginLeft: 6,
    color: "#666",
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },

  header: {
    padding: 16,
    borderBottom: "1px solid #e5e5e5",
  },

  h1: {
    fontSize: 20,
    fontWeight: 700,
  },

  sub: {
    fontSize: 13,
    color: "#888",
  },

  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: 16,
  },

  msg: (role) => ({
    display: "flex",
    justifyContent: role === "user" ? "flex-end" : "flex-start",
    marginBottom: 10,
  }),

  bubble: (role) => ({
    maxWidth: "70%",
    padding: "10px 12px",
    borderRadius: 6,
    background: role === "user" ? "#1a1a1a" : "#f4f3ef",
    color: role === "user" ? "#fff" : "#000",
    fontSize: 13,
    whiteSpace: "pre-wrap",
  }),

  inputRow: {
    display: "flex",
    gap: 8,
    padding: 12,
    borderTop: "1px solid #e5e5e5",
  },

  input: {
    flex: 1,
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 13,
  },

  btn: {
    padding: "10px 16px",
    border: "none",
    background: "#1a1a1a",
    color: "#fff",
    borderRadius: 6,
    cursor: "pointer",
  },

  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    padding: "0 16px 12px",
  },

  suggBtn: {
    padding: "6px 10px",
    border: "1px solid #ddd",
    borderRadius: 6,
    background: "#fff",
    cursor: "pointer",
    fontSize: 12,
    color: "#333",
  },
};

function TypingIndicator() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: "50%", background: "#aaa",
            display: "inline-block",
            animation: `bounce 1.2s ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }`}</style>
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

  // -----------------------------
  // LOAD SESSIONS
  // -----------------------------
  useEffect(() => {
    fetch(`${API}/sessions/`)
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((s) => ({
          id: s.id,
          title: s.title,
          messages: [],
        }));

        setSessions(mapped);

        if (mapped.length) {
          setActiveId(mapped[0].id);
        }
      });
  }, []);

  // -----------------------------
  // LOAD MESSAGES FOR ACTIVE SESSION
  // -----------------------------
  useEffect(() => {
    if (!activeId) return;

    const session = sessions.find((s) => s.id === activeId);
    // Only fetch if messages haven't been loaded yet
    if (session && session.messages.length > 0) return;

    fetch(`${API}/sessions/${activeId}/`)
      .then((res) => res.json())
      .then((data) => {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeId
              ? { ...s, messages: data.messages || [] }
              : s
          )
        );
      })
      .catch((err) => console.error("Failed to load session messages:", err));
  }, [activeId]);

  // -----------------------------
  // CREATE SESSION
  // -----------------------------
  const createSession = async () => {
    const res = await fetch(`${API}/sessions/create/`, {
      method: "POST",
    });

    const data = await res.json();

    const newSession = {
      id: data.id,
      title: data.title,
      messages: [],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveId(newSession.id);
  };

  // -----------------------------
  // RENAME SESSION
  // -----------------------------
  const renameSession = async (id) => {
    const current = sessions.find((s) => s.id === id);

    const title = prompt("Rename chat", current?.title || "");

    if (!title?.trim()) return;

    await fetch(`${API}/sessions/${id}/rename/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    setSessions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, title } : s
      )
    );
  };

  // -----------------------------
  // DELETE SESSION
  // -----------------------------
  const deleteSession = async (id) => {
    await fetch(`${API}/sessions/${id}/delete/`, {
      method: "POST",
    });

    setSessions((prev) => prev.filter((s) => s.id !== id));

    if (activeId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      setActiveId(remaining[0]?.id || null);
    }
  };

  // -----------------------------
  // SEND MESSAGE
  // -----------------------------
  const send = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;

    // Auto-create session if none is active
    let sessionId = activeId;
    if (!sessionId) {
      const res = await fetch(`${API}/sessions/create/`, {
        method: "POST",
      });
      const data = await res.json();
      sessionId = data.id;
      const newSession = { id: data.id, title: data.title, messages: [] };
      setSessions((prev) => [newSession, ...prev]);
      setActiveId(sessionId);
    }

    setInput("");
    setLoading(true);

    // add user message
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: [...s.messages, { role: "user", content: msg }],
            }
          : s
      )
    );

    try {
      const res = await fetch(`${API}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionId,
          message: msg,
          user_id: userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.error);
        return;
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: [...s.messages, data.message],
              }
            : s
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [sessions, loading]);

  const activeSession = sessions.find((sess) => sess.id === activeId);

  return (
    <div style={s.container}>
      {/* SIDEBAR */}
      <div style={s.sidebar}>
        <button style={s.newChatBtn} onClick={createSession}>
          + New Chat
        </button>

        <div style={s.sessionList}>
          {sessions.map((sesh) => (
            <div
              key={sesh.id}
              style={s.sessionItem(sesh.id === activeId)}
            >
              <div
                style={s.sessionTitle}
                onClick={() => setActiveId(sesh.id)}
              >
                {sesh.title}
              </div>

              <div>
                <button
                  style={s.iconBtn}
                  onClick={() => renameSession(sesh.id)}
                >
                  ✎
                </button>

                <button
                  style={s.iconBtn}
                  onClick={() => deleteSession(sesh.id)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div style={s.main}>
        <div style={s.header}>
          <div style={s.h1}>AI Assistant</div>
          <div style={s.sub}>Ask anything about your career</div>
        </div>

        {!cvUploaded && (
          <div style={{ background: "#fafafa", border: "1px solid #e5e5e5", borderRadius: 6, padding: "12px 16px", margin: "12px 16px 0", fontSize: 13, color: "#555" }}>
            No CV uploaded yet. Grounded career analysis requires a CV upload on the Profile page.
          </div>
        )}

        <div ref={chatAreaRef} style={s.chatArea}>
          {(!activeSession || activeSession.messages.length === 0) && (
            <>
              <div style={{ color: "#aaa", textAlign: "center", marginBottom: 16 }}>
                Start a conversation or try a suggestion:
              </div>
              <div style={s.suggestions}>
                {SUGGESTIONS.map((q) => (
                  <button key={q} style={s.suggBtn} onClick={() => send(q)}>{q}</button>
                ))}
              </div>
            </>
          )}

          {activeSession?.messages.map((m, i) => (
            <div key={i} style={s.msg(m.role)}>
              <div style={s.bubble(m.role)}>
                {m.role === "assistant" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                ) : (
                  m.content
                )}
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

        {/* INPUT */}
        <div style={s.inputRow}>
          <input
            style={s.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message..."
          />

          <button style={s.btn} onClick={() => send()} disabled={loading}>
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}