import { useState, useEffect } from "react";
import useAuth from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import api from "../src/api";

const s = {
  page: {
    fontFamily: "'Roboto Mono', monospace",
    background: "#f7f6f3",
    minHeight: "100vh",
    padding: "12px 8px",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: 1400,
    margin: "0 auto 16px",
    paddingBottom: 12,
    borderBottom: "1px solid #e5e5e5",
  },
  backBtn: {
    background: "none",
    border: "1px solid #ddd",
    borderRadius: 5,
    padding: "5px 12px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "'Roboto Mono', monospace",
    color: "#555",
  },
  logoutBtn: {
    background: "none",
    border: "1px solid #ddd",
    borderRadius: 5,
    padding: "5px 12px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "'Roboto Mono', monospace",
    color: "#888",
  },
  header: {
    maxWidth: 1400,
    margin: "0 auto 16px",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 12,
    maxWidth: 1400,
    margin: "0 auto 20px",
  },
  statCard: {
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: 8,
    padding: "14px 14px",
  },
  statLabel: {
    fontSize: 11,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1a1a1a",
  },
  section: {
    maxWidth: 1400,
    margin: "0 auto 20px",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: "1px solid #e5e5e5",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: 10,
    overflow: "hidden",
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    background: "#fafafa",
    borderBottom: "1px solid #e5e5e5",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#555",
    fontWeight: 600,
  },
  td: {
    padding: "10px 14px",
    borderBottom: "1px solid #f0f0f0",
  },
  badge: (color) => ({
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    background: color === "admin" ? "#4a4a4a" : "#c8c8c8",
    color: color === "admin" ? "#fff" : "#333",
  }),
  userGroup: {
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
  },
  userGroupHeader: {
    padding: "12px 16px",
    background: "#f5f5f5",
    borderBottom: "1px solid #e5e5e5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userGroupName: {
    fontWeight: 600,
    fontSize: 13,
    color: "#1a1a1a",
  },
  userGroupCount: {
    fontSize: 11,
    color: "#888",
  },
  summaryBox: {
    padding: "14px 16px",
    background: "#fafafa",
    borderTop: "1px solid #eee",
    fontSize: 12,
    lineHeight: 1.6,
  },
  summaryLabel: {
    fontWeight: 600,
    color: "#555",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    marginTop: 10,
    marginBottom: 3,
  },
  summaryValue: {
    color: "#333",
    fontSize: 12,
  },
  skillTag: {
    display: "inline-block",
    padding: "2px 8px",
    background: "#e8e8e8",
    borderRadius: 3,
    fontSize: 11,
    color: "#444",
    margin: "2px 4px 2px 0",
  },
  summaryToggle: {
    background: "none",
    border: "none",
    color: "#666",
    fontSize: 11,
    cursor: "pointer",
    padding: "2px 0",
    fontFamily: "'Roboto Mono', monospace",
    textDecoration: "underline",
  },
  error: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    padding: 12,
    fontSize: 13,
    color: "#b91c1c",
    borderRadius: 6,
    marginBottom: 20,
    maxWidth: 1400,
    margin: "0 auto 20px",
  },
  empty: {
    padding: 30,
    textAlign: "center",
    color: "#999",
    fontSize: 13,
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: 10,
  },
  loader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
    color: "#888",
    fontFamily: "'Roboto Mono', monospace",
  },
};

function CVSummary({ cv }) {
  const [open, setOpen] = useState(false);
  const skills = cv.skills || [];
  const experience = cv.experience || [];
  const education = cv.education || [];
  const projects = cv.projects || [];

  return (
    <div style={s.summaryBox}>
      <button style={s.summaryToggle} onClick={() => setOpen(!open)}>
        {open ? "Hide details" : "Show details"}
      </button>

      {open && (
        <>
          {cv.name && (
            <>
              <div style={s.summaryLabel}>Name</div>
              <div style={s.summaryValue}>{cv.name}</div>
            </>
          )}
          {cv.title && (
            <>
              <div style={s.summaryLabel}>Title</div>
              <div style={s.summaryValue}>{cv.title}</div>
            </>
          )}
          {cv.email && (
            <>
              <div style={s.summaryLabel}>Email</div>
              <div style={s.summaryValue}>{cv.email}</div>
            </>
          )}

          {skills.length > 0 && (
            <>
              <div style={s.summaryLabel}>Skills</div>
              <div>
                {skills.map((sk, i) => (
                  <span key={i} style={s.skillTag}>{sk}</span>
                ))}
              </div>
            </>
          )}

          {experience.length > 0 && (
            <>
              <div style={s.summaryLabel}>Experience</div>
              {experience.map((exp, i) => (
                <div key={i} style={{ ...s.summaryValue, marginBottom: 6 }}>
                  <strong>{exp.role}</strong>{exp.company ? ` @ ${exp.company}` : ""}
                  {exp.duration ? <span style={{ color: "#888" }}> ({exp.duration})</span> : null}
                </div>
              ))}
            </>
          )}

          {education.length > 0 && (
            <>
              <div style={s.summaryLabel}>Education</div>
              {education.map((edu, i) => (
                <div key={i} style={{ ...s.summaryValue, marginBottom: 4 }}>
                  <strong>{edu.degree}</strong>{edu.institution ? ` — ${edu.institution}` : ""}
                  {edu.year ? <span style={{ color: "#888" }}> ({edu.year})</span> : null}
                </div>
              ))}
            </>
          )}

          {projects.length > 0 && (
            <>
              <div style={s.summaryLabel}>Projects</div>
              {projects.map((p, i) => (
                <div key={i} style={{ ...s.summaryValue, marginBottom: 4 }}>
                  <strong>{p.name}</strong>{p.desc ? ` — ${p.desc}` : ""}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [jobApps, setJobApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [statsRes, usersRes, uploadsRes, appsRes] = await Promise.all([
          api.get("/api/users/admin/stats/"),
          api.get("/api/users/admin/users/"),
          api.get("/api/users/admin/cv-uploads/"),
          api.get("/api/users/admin/job-applications/"),
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
        setUploads(uploadsRes.data);
        setJobApps(appsRes.data);
      } catch (e) {
        setError(e.response?.data?.error || "Failed to load admin data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);


  if (loading) return <div style={s.loader}>Loading admin panel...</div>;

  const tabs = [
    { id: "users", label: `Users (${users.length})` },
    { id: "uploads", label: `CV Uploads (${uploads.length})` },
    { id: "jobs", label: `Job Apps (${jobApps.length})` },
  ];

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
        <button
          style={s.logoutBtn}
          onClick={async () => { await logout(); navigate("/"); }}
        >
          Sign out
        </button>
      </div>

      <div style={s.header}>
        <div style={s.title}>Admin Panel</div>
        <div style={s.subtitle}>
          Manage users, view uploads, and monitor platform activity.
        </div>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {/* Stats */}
      {stats && (
        <div style={s.statsGrid}>
          {[
            { label: "Total Users", value: stats.total_users },
            { label: "Admins", value: stats.total_admins },
            { label: "Regular Users", value: stats.total_regular_users },
            { label: "CV Uploads", value: stats.total_cv_uploads },
            { label: "Job Applications", value: stats.total_job_applications },
            { label: "Todos", value: stats.total_todos },
            { label: "Calendar Events", value: stats.total_calendar_events },
            { label: "Custom Goals", value: stats.total_custom_goals },
          ].map((item) => (
            <div key={item.label} style={s.statCard}>
              <div style={s.statLabel}>{item.label}</div>
              <div style={s.statValue}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ maxWidth: 1400, margin: "0 auto", marginBottom: 20, display: "flex", gap: 8 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 18px",
              border: "1px solid",
              borderColor: activeTab === tab.id ? "#1a1a1a" : "#e5e5e5",
              borderRadius: 6,
              background: activeTab === tab.id ? "#1a1a1a" : "#fff",
              color: activeTab === tab.id ? "#fff" : "#555",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'Roboto Mono', monospace",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      {activeTab === "users" && (
        <div style={s.section}>
          <div style={s.sectionTitle}>All Users</div>
          {users.length === 0 ? (
            <div style={s.empty}>No users found.</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>ID</th>
                  <th style={s.th}>Username</th>
                  <th style={s.th}>Full Name</th>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Role</th>
                  <th style={s.th}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={s.td}>{u.id}</td>
                    <td style={{ ...s.td, fontWeight: 600 }}>{u.username}</td>
                    <td style={s.td}>{u.full_name || "-"}</td>
                    <td style={s.td}>{u.email}</td>
                    <td style={s.td}>
                      <span style={s.badge(u.role)}>{u.role}</span>
                    </td>
                    <td style={s.td}>
                      {new Date(u.date_joined).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CV Uploads — grouped by user */}
      {activeTab === "uploads" && (
        <div style={s.section}>
          <div style={s.sectionTitle}>CV Uploads by User</div>
          {uploads.length === 0 ? (
            <div style={s.empty}>No CV uploads yet.</div>
          ) : (
            (() => {
              const grouped = {};
              uploads.forEach((r) => {
                const key = r.username || r.user_id;
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(r);
              });
              return Object.entries(grouped).map(([name, files]) => (
                <div key={name} style={s.userGroup}>
                  <div style={s.userGroupHeader}>
                    <span style={s.userGroupName}>{name}</span>
                    <span style={s.userGroupCount}>
                      {files.length} file{files.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <table style={{ ...s.table, border: "none", borderRadius: 0 }}>
                    <thead>
                      <tr>
                        <th style={s.th}>File Name</th>
                        <th style={s.th}>Type</th>
                        <th style={s.th}>Chunks</th>
                        <th style={s.th}>Uploaded At</th>
                        <th style={s.th}>Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((r) => {
                        const cv = r.cv_summary || {};
                        const hasSummary = cv.name || cv.title || (cv.skills && cv.skills.length);
                        return (
                          <>
                            <tr key={r.id}>
                              <td style={s.td}>{r.file_name}</td>
                              <td style={s.td}>{r.file_type}</td>
                              <td style={s.td}>{r.chunks_stored}</td>
                              <td style={s.td}>
                                {new Date(r.uploaded_at).toLocaleString()}
                              </td>
                              <td style={s.td}>
                                {hasSummary ? (
                                  <span style={s.summaryValue}>
                                    {cv.name || "—"}{cv.title ? ` — ${cv.title}` : ""}
                                  </span>
                                ) : (
                                  <span style={{ color: "#bbb" }}>No summary</span>
                                )}
                              </td>
                            </tr>
                            {hasSummary && (
                              <tr key={`${r.id}-summary`}>
                                <td colSpan={5} style={{ padding: 0 }}>
                                  <CVSummary cv={cv} />
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ));
            })()
          )}
        </div>
      )}

      {/* Job Applications Table */}
      {activeTab === "jobs" && (
        <div style={s.section}>
          <div style={s.sectionTitle}>All Job Applications</div>
          {jobApps.length === 0 ? (
            <div style={s.empty}>No job applications yet.</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>ID</th>
                  <th style={s.th}>User ID</th>
                  <th style={s.th}>Role</th>
                  <th style={s.th}>Company</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {jobApps.map((a) => (
                  <tr key={a.id}>
                    <td style={s.td}>{a.id}</td>
                    <td style={s.td}>{a.user_id}</td>
                    <td style={{ ...s.td, fontWeight: 600 }}>{a.role}</td>
                    <td style={s.td}>{a.company}</td>
                    <td style={s.td}>
                      <span
                        style={{
                          ...s.badge(
                            a.status === "Offer"
                              ? "admin"
                              : a.status === "Rejected"
                              ? "user"
                              : "admin"
                          ),
                        }}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td style={s.td}>{a.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
