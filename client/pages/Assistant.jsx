import { useState, useEffect } from "react";
import axios from "axios";

const SUGGESTIONS = [
  "Am I ready for a data engineer role?",
  "What skills am I missing for a Google internship?",
  "Build me a 3-month roadmap to become job-ready",
  "Draft a cover letter for a backend engineer role",
];

const s = {
  h1: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  sub: { color: "#888", fontSize: 13, marginBottom: 20 },
  suggestions: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 },
  suggBtn: { border: "1px solid #ddd", borderRadius: 20, padding: "5px 12px", background: "#fff", fontSize: 12, color: "#555", cursor: "pointer" },
  chatArea: { minHeight: 300, maxHeight: 480, overflowY: "auto", border: "1px solid #e5e5e5", borderRadius: 6, padding: 16, marginBottom: 12, background: "#fff" },
  msg: (role) => ({ display: "flex", justifyContent: role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }),
  bubble: (role) => ({ maxWidth: "72%", padding: "9px 13px", borderRadius: 6, fontSize: 13, lineHeight: 1.6, background: role === "user" ? "#1a1a1a" : "#f4f3ef", color: role === "user" ? "#fff" : "#1a1a1a", whiteSpace: "pre-wrap" }),
  inputRow: { display: "flex", gap: 8 },
  input: { flex: 1, border: "1px solid #ddd", borderRadius: 5, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", outline: "none" },
  btn: { border: "none", borderRadius: 5, padding: "9px 18px", background: "#1a1a1a", color: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
  empty: { color: "#bbb", fontSize: 13, textAlign: "center", paddingTop: 60 },
};

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
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

  return (
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

      <div style={s.chatArea}>
        {messages.length === 0 && <div style={s.empty}>Start a conversation. Try a suggestion above.</div>}
        {messages.map((m, i) => (
          <div key={i} style={s.msg(m.role)}>
            <div style={s.bubble(m.role)}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={s.msg("assistant")}>
            <div style={s.bubble("assistant")}>...</div>
          </div>
        )}
      </div>

      <div style={s.inputRow}>
        <input
          style={s.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about your career..."
        />
        <button style={s.btn} onClick={() => send()}>Send</button>
      </div>
    </div>
  );
}
