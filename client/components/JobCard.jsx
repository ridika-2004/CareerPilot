import { useState } from "react";
import useAuth from "../context/useAuth";
import api from "../src/api";

const s = {
  card: { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 8, padding: "16px 18px", marginBottom: 12 },
  top: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  role: { fontWeight: 700, fontSize: 15, color: "#111" },
  company: { color: "#555", fontSize: 13, marginTop: 2 },
  scores: { display: "flex", gap: 12, flexShrink: 0, alignItems: "flex-start" },
  scoreBox: (color) => ({
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
    padding: "4px 10px", borderRadius: 6, border: `1px solid ${color}22`,
    background: `${color}08`, minWidth: 56,
  }),
  scoreVal: (color) => ({ fontWeight: 700, fontSize: 16, color }),
  scoreLabel: { fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 },
  noCv: { fontSize: 11, color: "#999", fontStyle: "italic", padding: "8px 0" },

  grid: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: "6px 16px", marginBottom: 10, fontSize: 12, color: "#555",
  },
  gridItem: { display: "flex", alignItems: "center", gap: 6 },
  gridLabel: { color: "#999", fontSize: 11, minWidth: 60 },

  tagRow: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 },
  tag: { fontSize: 10, padding: "2px 8px", borderRadius: 3, background: "#f3f4f6", color: "#555", border: "1px solid #e5e7eb" },
  sourceBadge: { fontSize: 10, padding: "2px 8px", borderRadius: 3, background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe", fontWeight: 600 },

  locExact: { fontSize: 10, padding: "2px 8px", borderRadius: 3, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontWeight: 600 },
  locRemote: { fontSize: 10, padding: "2px 8px", borderRadius: 3, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", fontWeight: 600 },
  locOther: { fontSize: 10, padding: "2px 8px", borderRadius: 3, background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a", fontWeight: 600 },

  reason: { fontSize: 12, color: "#444", lineHeight: 1.7, borderTop: "1px solid #f0f0f0", paddingTop: 10, marginTop: 8 },
  reasonLabel: { fontWeight: 600, color: "#333" },

  actions: { display: "flex", gap: 8, marginTop: 12, alignItems: "center" },
  applyBtn: {
    padding: "7px 16px", border: "none", borderRadius: 5,
    background: "#1a1a1a", color: "#fff", cursor: "pointer",
    fontSize: 12, fontFamily: "'Roboto Mono', monospace", fontWeight: 600,
  },
  appliedBtn: {
    padding: "7px 16px", border: "1px solid #22c55e", borderRadius: 5,
    background: "#f0fdf4", color: "#16a34a", cursor: "default",
    fontSize: 12, fontFamily: "'Roboto Mono', monospace", fontWeight: 600,
  },
  viewLink: { fontSize: 11, color: "#888", textDecoration: "none" },
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch { return dateStr; }
}

export default function JobCard({ job }) {
  const { user } = useAuth();
  const userId = user?.user_id?.toString() || "";
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    if (applied || applying) return;
    setApplying(true);
    if (job.url) window.open(job.url, "_blank", "noopener,noreferrer");
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

  const urlDomain = job.url ? (() => {
    try { return new URL(job.url).hostname.replace("www.", ""); }
    catch { return ""; }
  })() : "";

  const hasScores = job.fit != null || job.relevance != null;
  const fitColor = job.fit >= 70 ? "#22c55e" : job.fit >= 40 ? "#f59e0b" : "#ef4444";
  const relColor = job.relevance >= 70 ? "#6366f1" : job.relevance >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div style={s.card}>
      {/* Top: Role + Company | Scores */}
      <div style={s.top}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.role}>{job.role}</div>
          <div style={s.company}>{job.company}</div>
        </div>
        <div style={s.scores}>
          {hasScores ? (
            <>
              {job.relevance != null && (
                <div style={s.scoreBox(relColor)}>
                  <div style={s.scoreVal(relColor)}>{job.relevance}%</div>
                  <div style={s.scoreLabel}>Match</div>
                </div>
              )}
              {job.fit != null && (
                <div style={s.scoreBox(fitColor)}>
                  <div style={s.scoreVal(fitColor)}>{job.fit}%</div>
                  <div style={s.scoreLabel}>CV Fit</div>
                </div>
              )}
            </>
          ) : (
            <div style={s.noCv}>Upload CV for AI scoring</div>
          )}
        </div>
      </div>

      {/* Structured info grid */}
      <div style={s.grid}>
        <div style={s.gridItem}>
          <span style={s.gridLabel}>Location</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {job.location}
            {job.location_tier === "exact" && <span style={s.locExact}>Match</span>}
            {job.location_tier === "remote" && <span style={s.locRemote}>Remote</span>}
            {job.location_tier === "other" && <span style={s.locOther}>Other</span>}
          </span>
        </div>
        <div style={s.gridItem}>
          <span style={s.gridLabel}>Salary</span>
          <span>{job.salary || "Not specified"}</span>
        </div>
        {job.posted_date && (
          <div style={s.gridItem}>
            <span style={s.gridLabel}>Posted</span>
            <span>{formatDate(job.posted_date)}</span>
          </div>
        )}
        {job.deadline && (
          <div style={s.gridItem}>
            <span style={s.gridLabel}>Deadline</span>
            <span>{job.deadline}</span>
          </div>
        )}
      </div>

      {/* Tags + Source */}
      {(job.tags?.length > 0 || job.source) && (
        <div style={s.tagRow}>
          {job.source && <span style={s.sourceBadge}>{job.source}</span>}
          {job.tags?.slice(0, 6).map((t, i) => (
            <span key={i} style={s.tag}>{t}</span>
          ))}
        </div>
      )}

      {/* Reason */}
      {job.reason && (
        <div style={s.reason}>
          <span style={s.reasonLabel}>Why this matches: </span>
          {job.reason}
        </div>
      )}

      {/* Actions */}
      <div style={s.actions}>
        <button
          style={applied ? s.appliedBtn : s.applyBtn}
          onClick={handleApply}
          disabled={applied || applying}
        >
          {applying ? "Saving..." : applied ? "Applied - Tracked" : "Apply & Track"}
        </button>
        {job.url && !applied && (
          <a href={job.url} target="_blank" rel="noopener noreferrer" style={s.viewLink}>
            View posting {urlDomain && `(${urlDomain})`}
          </a>
        )}
      </div>
    </div>
  );
}
