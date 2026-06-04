const s = {
  card: { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 6, padding: "16px 18px", marginBottom: 10 },
  top: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  role: { fontWeight: 600, fontSize: 14 },
  company: { color: "#555", fontSize: 13 },
  score: (v) => ({ fontWeight: 700, fontSize: 13, color: v >= 70 ? "#2d6a4f" : v >= 40 ? "#b5572a" : "#999" }),
  meta: { display: "flex", gap: 16, color: "#888", fontSize: 12, marginBottom: 6 },
  reason: { fontSize: 12, color: "#555", lineHeight: 1.5, borderTop: "1px solid #f0f0f0", paddingTop: 8, marginTop: 8 },
};

export default function JobCard({ job }) {
  return (
    <div style={s.card}>
      <div style={s.top}>
        <div>
          <div style={s.role}>{job.role}</div>
          <div style={s.company}>{job.company}</div>
        </div>
        <div style={s.score(job.fit)}>
          {job.fit}% fit
        </div>
      </div>
      <div style={s.meta}>
        <span>{job.location}</span>
        {job.salary && <span>{job.salary}</span>}
        {job.deadline && <span>Due {job.deadline}</span>}
      </div>
      {job.reason && <div style={s.reason}>{job.reason}</div>}
    </div>
  );
}
