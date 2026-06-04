import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API = "http://localhost:8000/assistant";
import { useState, useEffect } from "react";
import axios from "axios";

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
};

export default function Assistant() {
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");

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
  const send = async () => {
    if (!input.trim() || !activeId) return;

    const text = input;
    setInput("");

    // user message
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeId
          ? {
              ...s,
              messages: [
                ...s.messages,
                { role: "user", content: text },
              ],
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
          sessionId: activeId,
          message: text,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.error);
        return;
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeId
            ? {
                ...s,
                messages: [...s.messages, data.message],
              }
            : s
        )
      );
    } catch (err) {
      console.error(err);
  const [loading, setLoading] = useState(false);
  const [cvUploaded, setCvUploaded] = useState(false);

  useEffect(() => {
    setCvUploaded(localStorage.getItem("cv_uploaded") === "true");
  }, []);

  const send = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setInput("");
    const next = [...messages, { role: "user", content: msg }];
    setMessages(next);
    setLoading(true);

    const userId = localStorage.getItem("user_id") || "user_default";

    try {
      const res = await axios.post("http://localhost:8000/api/cv/ask/", {
        user_id: userId,
        question: msg,
      });
      let reply = res.data.answer;
      if (res.data.source_sections && res.data.source_sections.length > 0) {
        const uniqueSections = [...new Set(res.data.source_sections)].map(s => s.toUpperCase());
        reply += `\n\n*(Grounded in sections: ${uniqueSections.join(", ")})*`;
      }
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "Sorry, I had trouble connecting to the career pilot agent: " + (err.response?.data?.error || err.message),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const activeSession = sessions.find((s) => s.id === activeId);

  return (
    <div style={s.container}>
      {/* SIDEBAR */}
      <div style={s.sidebar}>
        <button style={s.newChatBtn} onClick={createSession}>
          + New Chat
        </button>
    <div>
      <div style={s.h1}>AI Assistant</div>
      <div style={s.sub}>Ask anything about your career. Responses are grounded in your CV.</div>

      {!cvUploaded && (
        <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 6, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#b78103" }}>
          ⚠️ No CV has been uploaded yet. Grounded career analysis will not work until you upload a PDF or DOCX file on the <strong>Profile</strong> page.
        </div>
      )}

      <div style={s.suggestions}>
        {SUGGESTIONS.map((q) => (
          <button key={q} style={s.suggBtn} onClick={() => send(q)}>{q}</button>
        ))}
      </div>

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

        <div style={s.chatArea}>
          {activeSession?.messages.length === 0 && (
            <div style={{ color: "#aaa", textAlign: "center" }}>
              Start a conversation
            </div>
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

          <button style={s.btn} onClick={send}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}