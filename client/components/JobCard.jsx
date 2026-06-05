import { useState } from "react";
import useAuth from "../context/useAuth";
import api from "../src/api";

const s = {
  card: { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 8, padding: "16px 18px", marginBottom: 12, transition: "box-shadow 0.15s" },
  top: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  role: { fontWeight: 700, fontSize: 14, color: "#111" },
  company: { color: "#555", fontSize: 13, marginTop: 1 },
  scoreWrap: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  fitBar: { width: 48, height: 6, background: "#eee", borderRadius: 3, overflow: "hidden" },
  fitFill: (v) => ({ height: "100%", width: `${v}%`, background: "#1a1a1a", borderRadius: 3 }),
  score: { fontWeight: 700, fontSize: 13, color: "#555" },
  meta: { display: "flex", gap: 16, color: "#888", fontSize: 12, marginBottom: 8, flexWrap: "wrap" },
  reason: { fontSize: 12, color: "#555", lineHeight: 1.6, borderTop: "1px solid #f0f0f0", paddingTop: 10, marginTop: 10 },
  reasonLabel: { fontWeight: 600, color: "#444" },
  actions: { display: "flex", gap: 8, marginTop: 10 },
  applyBtn: {
    padding: "6px 14px", border: "none", borderRadius: 5,
    background: "#1a1a1a", color: "#fff", cursor: "pointer",
    fontSize: 12, fontFamily: "'Roboto Mono', monospace", fontWeight: 600,
    transition: "background 0.15s",
  },
  appliedBtn: {
    padding: "6px 14px", border: "1px solid #555", borderRadius: 5,
    background: "#f5f5f5", color: "#555", cursor: "default",
    fontSize: 12, fontFamily: "'Roboto Mono', monospace", fontWeight: 600,
  },
};

export default function JobCard({ job }) {
  const { user } = useAuth();
  const userId = user?.user_id?.toString() || "";
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    if (applied || applying) return;
    setApplying(true);
    try {
      await api.post(`/api/tracker/applications/`, {
        user_id: userId,
        role: job.role,
        company: job.company,
        status: "Applied",
      });
      setApplied(true);
    } catch (err) {
      console.error("Failed to save application:", err);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div style={s.card}>
      <div style={s.top}>
        <div>
          <div style={s.role}>{job.role}</div>
          <div style={s.company}>{job.company}</div>
        </div>
        <div style={s.scoreWrap}>
          <div style={s.fitBar}>
            <div style={s.fitFill(job.fit)} />
          </div>
          <div style={s.score}>{job.fit}% fit</div>
        </div>
      </div>
      <div style={s.meta}>
        <span>{job.location}</span>
        {job.salary && <span>{job.salary}</span>}
        {job.deadline && <span>Due {job.deadline}</span>}
      </div>
      {job.reason && (
        <div style={s.reason}>
          <span style={s.reasonLabel}>Why this matches: </span>
          {job.reason}
        </div>
      )}
      <div style={s.actions}>
        <button
          style={applied ? s.appliedBtn : s.applyBtn}
          onClick={handleApply}
          disabled={applied || applying}
        >
          {applying ? "Saving..." : applied ? "✓ Applied" : "Apply & Track"}
        </button>
      </div>
    </div>
  );
}
