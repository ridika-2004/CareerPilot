import { useState } from "react";

const SUGGESTIONS = [
  "Am I ready for a data engineer role?",
  "What skills am I missing for a Google internship?",
  "Build me a 3-month roadmap to become job-ready",
  "Draft a cover letter for a backend engineer role",
];

const MOCK_RESPONSES = {
  default: "Based on your CV, I can see you have strong Python and data skills. Let me analyze that in detail for this query...",
  ready: "Looking at your CV against a typical data engineer JD:\n\nStrengths: SQL (3 projects), Python, pandas, ETL pipelines.\nGaps: You lack hands-on Spark/Hadoop experience and cloud data warehousing (Snowflake/BigQuery). These appear in ~80% of senior DE roles.\n\nVerdict: Ready for junior DE roles. 2–3 months of targeted practice closes the senior gap.",
  skills: "For a Google internship (SWE), benchmarking against their known requirements:\n\nYou have: Python, Git, basic data structures.\nYou're missing:\n- Strong DSA (LeetCode med/hard fluency)\n- System design fundamentals\n- At least one solid CS project with measurable impact\n\nPriority: DSA practice daily for 6 weeks.",
  roadmap: "3-Month Job-Ready Roadmap:\n\nMonth 1 — Foundation\n- Week 1–2: LeetCode easy/medium (arrays, strings)\n- Week 3–4: Complete one system design course\n\nMonth 2 — Build\n- Week 5–6: Build and deploy one full-stack project\n- Week 7–8: Contribute to 2 open-source repos\n\nMonth 3 — Apply\n- Week 9–10: Tailor CV, start applying (5/week)\n- Week 11–12: Mock interviews, negotiation prep",
  cover: "Cover Letter Draft:\n\nDear Hiring Team,\n\nI'm applying for the Backend Engineer role at [Company]. With two years of Python development and hands-on experience building REST APIs for 10,000+ daily users at [Your Project], I'm confident I can contribute immediately.\n\nIn my last project, I reduced API latency by 40% through query optimization and caching — the kind of impact I'm eager to bring to your team.\n\nI'd welcome the chance to discuss how my background fits your needs.\n\nBest,\n[Your Name]",
};

function getReply(msg) {
  const m = msg.toLowerCase();
  if (m.includes("ready") || m.includes("data engineer")) return MOCK_RESPONSES.ready;
  if (m.includes("missing") || m.includes("google") || m.includes("skills")) return MOCK_RESPONSES.skills;
  if (m.includes("roadmap") || m.includes("month")) return MOCK_RESPONSES.roadmap;
  if (m.includes("cover") || m.includes("letter")) return MOCK_RESPONSES.cover;
  return MOCK_RESPONSES.default;
}

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

  const send = (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setInput("");
    const next = [...messages, { role: "user", content: msg }];
    setMessages(next);
    setLoading(true);
    setTimeout(() => {
      setMessages([...next, { role: "assistant", content: getReply(msg) }]);
      setLoading(false);
    }, 900);
  };

  return (
    <div>
      <div style={s.h1}>AI Assistant</div>
      <div style={s.sub}>Ask anything about your career. Responses are grounded in your CV.</div>

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
