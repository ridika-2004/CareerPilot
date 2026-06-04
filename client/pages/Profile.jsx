import { useState, useRef } from "react";
import axios from "axios";
import useAuth from "../context/useAuth";

const s = {
  h1: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  sub: { color: "#888", fontSize: 13, marginBottom: 24 },
  uploadBox: { border: "2px dashed #ddd", borderRadius: 6, padding: "32px 24px", textAlign: "center", marginBottom: 24, background: "#fff" },
  uploadLabel: { fontSize: 14, color: "#555", marginBottom: 8 },
  uploadSub: { fontSize: 12, color: "#aaa", marginBottom: 12 },
  btn: (v) => ({ border: `1px solid ${v ? "#ccc" : "#1a1a1a"}`, borderRadius: 5, padding: "8px 18px", background: v ? "#f4f3ef" : "#1a1a1a", color: v ? "#555" : "#fff", cursor: "pointer", fontSize: 13, fontFamily: "inherit", marginRight: 8 }),
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  box: { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 6, padding: 16, marginBottom: 16 },
  boxHead: { fontWeight: 600, fontSize: 13, marginBottom: 12 },
  tag: { display: "inline-block", border: "1px solid #ddd", borderRadius: 3, padding: "2px 8px", fontSize: 11, marginRight: 5, marginBottom: 5, color: "#555" },
  expItem: { marginBottom: 10 },
  expRole: { fontWeight: 600, fontSize: 13 },
  expCo: { color: "#777", fontSize: 12, marginBottom: 4 },
  bullet: { fontSize: 12, color: "#555", paddingLeft: 12, marginBottom: 2 },
  projItem: { marginBottom: 8 },
  projName: { fontWeight: 600, fontSize: 12 },
  projDesc: { fontSize: 12, color: "#666" },
};

export default function Profile() {
  const { user } = useAuth();
  const userId = user?.user_id?.toString() || "anonymous";

  // Per-user localStorage keys
  const cvUploadedKey = `cv_uploaded_${userId}`;
  const cvResultKey = `cv_upload_result_${userId}`;

  // Derive initial state from localStorage (no effect needed)
  const savedResult = (() => {
    try {
      const raw = localStorage.getItem(cvResultKey);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const [uploaded, setUploaded] = useState(() => localStorage.getItem(cvUploadedKey) === "true");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadResult, setUploadResult] = useState(savedResult);
  const [cv, setCv] = useState(savedResult?.parsed_cv || null);
  const fileInputRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("cv", file);
    formData.append("user_id", userId);

    try {
      const res = await axios.post("http://localhost:8000/api/cv/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setUploadResult(res.data);
      setUploaded(true);
      if (res.data.parsed_cv) {
        setCv(res.data.parsed_cv);
      }
      localStorage.setItem(cvUploadedKey, "true");
      localStorage.setItem(cvResultKey, JSON.stringify(res.data));
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div>
      <div style={s.h1}>Profile</div>
      <div style={s.sub}>Your CV is the source of truth for every agent and recommendation.</div>

      <div style={s.uploadBox}>
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.doc,.docx"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <div style={s.uploadLabel}>
          {loading ? "Processing CV..." : uploaded ? "CV uploaded and indexed" : "Upload your CV"}
        </div>
        <div style={s.uploadSub}>
          {loading
            ? "Extracting text, chunking, and generating embeddings..."
            : uploaded
            ? `Chunks stored: ${uploadResult?.chunks_stored || 0} | Sections: ${uploadResult?.sections?.join(", ") || ""}`
            : "PDF or DOCX -- all agents will use this"}
        </div>
        {error && <div style={{ color: "#999", fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <button
          style={s.btn(uploaded || loading)}
          disabled={loading}
          onClick={() => fileInputRef.current.click()}
        >
          {loading ? "Uploading..." : uploaded ? "Re-upload CV" : "Choose file"}
        </button>
      </div>

      {uploaded && cv && (
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>
            {cv.name} -- <span style={{ fontWeight: 400, color: "#666", fontSize: 14 }}>{cv.title}</span>
          </div>

          <div style={s.grid}>
            <div>
              <div style={s.box}>
                <div style={s.boxHead}>Skills</div>
                {cv.skills?.map((sk) => <span key={sk} style={s.tag}>{sk}</span>)}
              </div>

              <div style={s.box}>
                <div style={s.boxHead}>Education</div>
                {cv.education?.map((e) => (
                  <div key={e.degree}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{e.degree}</div>
                    <div style={{ fontSize: 12, color: "#777" }}>{e.institution} - {e.year}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={s.box}>
                <div style={s.boxHead}>Experience</div>
                {cv.experience?.map((e) => (
                  <div key={e.role} style={s.expItem}>
                    <div style={s.expRole}>{e.role}</div>
                    <div style={s.expCo}>{e.company} - {e.duration}</div>
                    {e.bullets?.map((b) => <div key={b} style={s.bullet}>- {b}</div>)}
                  </div>
                ))}
              </div>

              <div style={s.box}>
                <div style={s.boxHead}>Projects</div>
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
