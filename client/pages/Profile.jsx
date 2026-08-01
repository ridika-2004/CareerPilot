import { useState, useRef, useEffect } from "react";
import useAuth from "../context/useAuth";
import api from "../src/api";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Briefcase, GraduationCap, Code2, FolderOpen, User } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const userId = user?.user_id?.toString() || "anonymous";
  const cvUploadedKey = `cv_uploaded_${userId}`;
  const cvResultKey = `cv_upload_result_${userId}`;

  const savedResult = (() => {
    try { const raw = localStorage.getItem(cvResultKey); return raw ? JSON.parse(raw) : null; } catch (e) { console.debug(e); return null; }
  })();

  const [uploaded, setUploaded] = useState(() => localStorage.getItem(cvUploadedKey) === "true");
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadResult, setUploadResult] = useState(savedResult);
  const [cv, setCv] = useState(savedResult?.parsed_cv || null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!userId || userId === "anonymous") return;
    let cancelled = false;
    api.get(`/api/cv/status/?user_id=${userId}`)
      .then((res) => {
        if (cancelled) return;
        if (res.data.uploaded) {
          setUploaded(true);
          setUploadResult(res.data);
          if (res.data.parsed_cv) setCv(res.data.parsed_cv);
          localStorage.setItem(cvUploadedKey, "true");
          localStorage.setItem(cvResultKey, JSON.stringify(res.data));
        }
      })
      .catch((e) => console.debug(e))
      .finally(() => { if (!cancelled) setStatusLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  const handleUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("cv", file);
    formData.append("user_id", userId);
    try {
      const res = await api.post(`/api/cv/upload/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setUploadResult(res.data);
      setUploaded(true);
      if (res.data.parsed_cv) setCv(res.data.parsed_cv);
      localStorage.setItem(cvUploadedKey, "true");
      localStorage.setItem(cvResultKey, JSON.stringify(res.data));
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed. Please try again.");
    } finally { setLoading(false); }
  };

  const initials = (user?.full_name || user?.username || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="anim-fade-up">
      {/* Header */}
      <div style={s.profileHeader}>
        <div style={s.avatarLarge}>{initials}</div>
        <div>
          <h1 style={s.h1}>{user?.full_name || user?.username || "Profile"}</h1>
          <p style={s.sub}>{user?.email}</p>
        </div>
      </div>

      {/* Upload Section */}
      <div style={s.uploadCard} className="anim-fade-up anim-fade-up-d1">
        <input type="file" ref={fileInputRef} accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />

        {loading ? (
          <div style={s.uploadInner}>
            <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "var(--accent)" }} />
            <div style={s.uploadLabel}>Processing your CV...</div>
            <div style={s.uploadSub}>Extracting text, chunking, and generating embeddings</div>
          </div>
        ) : uploaded ? (
          <div style={s.uploadInner}>
            <CheckCircle2 size={28} style={{ color: "var(--success)" }} />
            <div style={s.uploadLabel}>CV uploaded and indexed</div>
            <div style={s.uploadSub}>
              {uploadResult?.chunks_stored || 0} chunks stored
              {uploadResult?.sections?.length ? ` · ${uploadResult.sections.join(", ")}` : ""}
            </div>
            <button style={s.reuploadBtn} onClick={() => fileInputRef.current.click()}>
              <Upload size={14} /> Re-upload CV
            </button>
          </div>
        ) : (
          <div style={s.uploadInner}>
            <div style={s.uploadIconCircle}>
              <FileText size={24} />
            </div>
            <div style={s.uploadLabel}>Upload your CV</div>
            <div style={s.uploadSub}>PDF or DOCX — all agents will use this as the source of truth</div>
            {error && (
              <div style={s.errorBox}>
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <button style={s.uploadBtn} onClick={() => fileInputRef.current.click()} disabled={statusLoading}>
              <Upload size={15} /> Choose file
            </button>
          </div>
        )}
      </div>

      {/* CV Data */}
      {uploaded && cv && (
        <div className="anim-fade-up anim-fade-up-d2">
          {/* Name & Title */}
          <div style={s.cvNameRow}>
            <User size={18} style={{ color: "var(--accent)" }} />
            <span style={s.cvName}>{cv.name}</span>
            {cv.title && <span style={s.cvTitle}>— {cv.title}</span>}
          </div>

          <div style={s.cvGrid}>
            {/* Left column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Skills */}
              <div style={s.card}>
                <div style={s.cardHead}>
                  <Code2 size={16} style={{ color: "var(--accent)" }} /> Skills
                </div>
                <div style={s.tagWrap}>
                  {cv.skills?.map((sk) => <span key={sk} style={s.tag}>{sk}</span>)}
                </div>
              </div>

              {/* Education */}
              <div style={s.card}>
                <div style={s.cardHead}>
                  <GraduationCap size={16} style={{ color: "#555555" }} /> Education
                </div>
                {cv.education?.map((e) => (
                  <div key={e.degree} style={s.eduItem}>
                    <div style={s.eduDegree}>{e.degree}</div>
                    <div style={s.eduMeta}>{e.institution} · {e.year}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Experience */}
              <div style={s.card}>
                <div style={s.cardHead}>
                  <Briefcase size={16} style={{ color: "#333333" }} /> Experience
                </div>
                {cv.experience?.map((e) => (
                  <div key={e.role} style={s.expItem}>
                    <div style={s.expRole}>{e.role}</div>
                    <div style={s.expMeta}>{e.company} · {e.duration}</div>
                    {e.bullets?.map((b) => <div key={b} style={s.bullet}>{b}</div>)}
                  </div>
                ))}
              </div>

              {/* Projects */}
              <div style={s.card}>
                <div style={s.cardHead}>
                  <FolderOpen size={16} style={{ color: "#888888" }} /> Projects
                </div>
                {cv.projects?.map((p) => (
                  <div key={p.name} style={s.projItem}>
                    <div style={s.projName}>{p.name}</div>
                    <div style={s.projDesc}>{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  profileHeader: { display: "flex", alignItems: "center", gap: 16, marginBottom: 28 },
  avatarLarge: {
    width: 52, height: 52, borderRadius: 14, background: "var(--accent-gradient)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--btn-accent-text)", fontSize: 18, fontWeight: 700, letterSpacing: "0.5px", flexShrink: 0,
  },
  h1: { fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.3px" },
  sub: { color: "var(--text-muted)", fontSize: 14 },

  uploadCard: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "32px 24px",
    marginBottom: 28, textAlign: "center",
    boxShadow: "var(--shadow-sm)",
  },
  uploadInner: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  uploadIconCircle: {
    width: 52, height: 52, borderRadius: 14, background: "var(--accent-light)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--accent)",
  },
  uploadLabel: { fontSize: 16, fontWeight: 600, color: "var(--text-primary)" },
  uploadSub: { fontSize: 13, color: "var(--text-muted)", maxWidth: 360 },
  uploadBtn: {
    display: "flex", alignItems: "center", gap: 8,
    marginTop: 6, padding: "10px 24px", border: "none",
    borderRadius: "var(--radius-md)", background: "var(--accent-gradient)",
    color: "var(--btn-accent-text)", fontSize: 14, fontWeight: 600, cursor: "pointer",
    fontFamily: "var(--font-sans)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  reuploadBtn: {
    display: "flex", alignItems: "center", gap: 6,
    marginTop: 4, padding: "8px 18px", border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)", background: "transparent",
    color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer",
    fontFamily: "var(--font-sans)",
  },
  errorBox: {
    display: "flex", alignItems: "center", gap: 6,
    background: "var(--danger-light)", color: "#b91c1c",
    borderRadius: "var(--radius-sm)", padding: "8px 12px", fontSize: 12,
  },

  cvNameRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20 },
  cvName: { fontSize: 16, fontWeight: 700, color: "var(--text-primary)" },
  cvTitle: { fontSize: 15, color: "var(--text-muted)", fontWeight: 400 },

  cvGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },

  card: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "18px 20px",
    boxShadow: "var(--shadow-xs)",
  },
  cardHead: {
    display: "flex", alignItems: "center", gap: 8,
    fontWeight: 600, fontSize: 14, color: "var(--text-primary)",
    marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid var(--border-light)",
  },
  tagWrap: { display: "flex", flexWrap: "wrap", gap: 6 },
  tag: {
    display: "inline-block", padding: "4px 10px",
    borderRadius: "var(--radius-full)", background: "var(--bg-elevated)",
    border: "1px solid var(--border-light)",
    fontSize: 12, color: "var(--text-secondary)", fontWeight: 500,
  },
  eduItem: { marginBottom: 10 },
  eduDegree: { fontWeight: 600, fontSize: 14, color: "var(--text-primary)" },
  eduMeta: { fontSize: 13, color: "var(--text-muted)" },
  expItem: { marginBottom: 12 },
  expRole: { fontWeight: 600, fontSize: 14, color: "var(--text-primary)" },
  expMeta: { fontSize: 13, color: "var(--text-muted)", marginBottom: 4 },
  bullet: { fontSize: 13, color: "var(--text-secondary)", paddingLeft: 14, lineHeight: 1.6 },
  projItem: { marginBottom: 10 },
  projName: { fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 2 },
  projDesc: { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 },
};
