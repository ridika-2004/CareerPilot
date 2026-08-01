import { useState } from "react";
import useAuth from "../context/useAuth";
import api from "../src/api";
import { MapPin, DollarSign, Clock, Calendar, ExternalLink, CheckCircle2, Loader2, TrendingUp } from "lucide-react";

function formatDate(dateStr) {
  if (!dateStr) return null;
  try { const d = new Date(dateStr); if (isNaN(d.getTime())) return dateStr; return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
  catch (e) { console.debug(e); return dateStr; }
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
      await api.post(`/api/tracker/applications/`, { user_id: userId, role: job.role, company: job.company, status: "Applied" });
      setApplied(true);
    } catch (err) { console.error("Failed to save application:", err); }
    finally { setApplying(false); }
  };

  const urlDomain = job.url ? (() => { try { return new URL(job.url).hostname.replace("www.", ""); } catch (e) { console.debug(e); return ""; } })() : "";
  const hasScores = job.fit != null || job.relevance != null;
  const fitColor = job.fit >= 70 ? "#1a1a1a" : job.fit >= 40 ? "#555555" : "#999999";
  const relColor = job.relevance >= 70 ? "#333333" : job.relevance >= 40 ? "#666666" : "#999999";

  const locTierBadge = {
    exact: { bg: "#ECEAE4", color: "#1a1a1a", label: "Match" },
    remote: { bg: "#F0EDE6", color: "#555555", label: "Remote" },
    other: { bg: "#ECEAE4", color: "#888888", label: "Other" },
  };

  return (
    <div style={s.card}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "var(--shadow-md)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "var(--shadow-xs)"}
    >
      {/* Top */}
      <div style={s.top}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.role}>{job.role}</div>
          <div style={s.company}>{job.company}</div>
        </div>
        <div style={s.scores}>
          {hasScores ? (<>
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
          </>) : (
            <div style={s.noCv}>
              <TrendingUp size={12} /> Upload CV for AI scoring
            </div>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div style={s.grid}>
        <div style={s.gridItem}>
          <MapPin size={13} style={{ color: "var(--text-faint)" }} />
          <span>{job.location}</span>
          {job.location_tier && locTierBadge[job.location_tier] && (
            <span style={s.locBadge(locTierBadge[job.location_tier])}>{locTierBadge[job.location_tier].label}</span>
          )}
        </div>
        <div style={s.gridItem}>
          <DollarSign size={13} style={{ color: "var(--text-faint)" }} />
          <span>{job.salary || "Not specified"}</span>
        </div>
        {job.posted_date && (
          <div style={s.gridItem}>
            <Clock size={13} style={{ color: "var(--text-faint)" }} />
            <span>{formatDate(job.posted_date)}</span>
          </div>
        )}
        {job.deadline && (
          <div style={s.gridItem}>
            <Calendar size={13} style={{ color: "var(--text-faint)" }} />
            <span>{job.deadline}</span>
          </div>
        )}
      </div>

      {/* Tags + Source */}
      {(job.tags?.length > 0 || job.source) && (
        <div style={s.tagRow}>
          {job.source && <span style={s.sourceBadge}>{job.source}</span>}
          {job.tags?.slice(0, 6).map((t, i) => <span key={i} style={s.tag}>{t}</span>)}
        </div>
      )}

      {/* Reason */}
      {job.reason && (
        <div style={s.reason}>
          <span style={s.reasonLabel}>Why this matches: </span>{job.reason}
        </div>
      )}

      {/* Actions */}
      <div style={s.actions}>
        <button style={applied ? s.appliedBtn : s.applyBtn} onClick={handleApply} disabled={applied || applying}>
          {applying ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving...</> :
           applied ? <><CheckCircle2 size={13} /> Applied - Tracked</> : "Apply & Track"}
        </button>
        {job.url && !applied && (
          <a href={job.url} target="_blank" rel="noopener noreferrer" style={s.viewLink}>
            <ExternalLink size={12} /> {urlDomain}
          </a>
        )}
      </div>
    </div>
  );
}

const s = {
  card: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "18px 20px", marginBottom: 14,
    transition: "box-shadow 0.2s", boxShadow: "var(--shadow-xs)",
  },
  top: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  role: { fontWeight: 700, fontSize: 16, color: "var(--text-primary)", letterSpacing: "-0.2px" },
  company: { color: "var(--text-muted)", fontSize: 13, marginTop: 2 },
  scores: { display: "flex", gap: 10, flexShrink: 0, alignItems: "flex-start" },
  scoreBox: (color) => ({
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
    padding: "6px 12px", borderRadius: 10, border: `1px solid ${color}22`,
    background: `${color}08`, minWidth: 58,
  }),
  scoreVal: (color) => ({ fontWeight: 700, fontSize: 17, color }),
  scoreLabel: { fontSize: 9, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 },
  noCv: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-faint)", fontStyle: "italic" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 10, fontSize: 13, color: "var(--text-secondary)" },
  gridItem: { display: "flex", alignItems: "center", gap: 6 },
  tagRow: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 },
  tag: { fontSize: 11, padding: "3px 9px", borderRadius: "var(--radius-full)", background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-light)", fontWeight: 500 },
  sourceBadge: { fontSize: 11, padding: "3px 9px", borderRadius: "var(--radius-full)", background: "#eef2ff", color: "#4f46e5", fontWeight: 600 },
  locBadge: (b) => ({ fontSize: 10, padding: "2px 8px", borderRadius: "var(--radius-full)", background: b.bg, color: b.color, fontWeight: 600, border: `1px solid ${b.color}22` }),
  reason: { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, borderTop: "1px solid var(--border-light)", paddingTop: 10, marginTop: 8 },
  reasonLabel: { fontWeight: 600, color: "var(--text-primary)" },
  actions: { display: "flex", gap: 10, marginTop: 14, alignItems: "center" },
  applyBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 18px", border: "none", borderRadius: "var(--radius-md)",
    background: "var(--accent-gradient)", color: "var(--btn-accent-text)", cursor: "pointer",
    fontSize: 13, fontFamily: "var(--font-sans)", fontWeight: 600,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  appliedBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 18px", border: "1px solid var(--success)",
    borderRadius: "var(--radius-md)", background: "var(--success-light)",
    color: "var(--success)", cursor: "default",
    fontSize: 13, fontFamily: "var(--font-sans)", fontWeight: 600,
  },
  viewLink: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-muted)", textDecoration: "none", fontWeight: 500 },
};
