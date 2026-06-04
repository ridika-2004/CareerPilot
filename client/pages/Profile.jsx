import { useState } from "react";

const PARSED_CV = {
  name: "Rafiul Islam",
  title: "CS Student — BUET",
  email: "rafiul@example.com",
  skills: ["Python", "TensorFlow", "SQL", "FastAPI", "Docker", "Git"],
  experience: [
    { role: "Backend Intern", company: "TechStart BD", duration: "Jun–Sep 2024", bullets: ["Built REST APIs serving 10k daily users", "Reduced DB query time by 40%"] },
  ],
  education: [{ degree: "B.Sc. in CSE", institution: "BUET", year: "2021–2025" }],
  projects: [
    { name: "Sentiment Analyzer", desc: "NLP model trained on 50k BD Twitter data, 88% accuracy" },
    { name: "E-commerce Backend", desc: "Django + PostgreSQL, deployed on AWS EC2" },
  ],
};

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
  const [uploaded, setUploaded] = useState(false);
  const [cv] = useState(PARSED_CV);

  return (
    <div>
      <div style={s.h1}>Profile</div>
      <div style={s.sub}>Your CV is the source of truth for every agent and recommendation.</div>

      <div style={s.uploadBox}>
        <div style={s.uploadLabel}>{uploaded ? "CV uploaded and indexed" : "Upload your CV"}</div>
        <div style={s.uploadSub}>{uploaded ? "Chunked, embedded, and stored in vector DB" : "PDF or DOCX — all agents will use this"}</div>
        <button style={s.btn(uploaded)} onClick={() => setUploaded(!uploaded)}>
          {uploaded ? "Re-upload" : "Choose file"}
        </button>
        {!uploaded && <button style={s.btn(true)}>Build CV here</button>}
      </div>

      {uploaded && (
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>
            {cv.name} — <span style={{ fontWeight: 400, color: "#666", fontSize: 14 }}>{cv.title}</span>
          </div>

          <div style={s.grid}>
            <div>
              <div style={s.box}>
                <div style={s.boxHead}>Skills</div>
                {cv.skills.map((sk) => <span key={sk} style={s.tag}>{sk}</span>)}
              </div>

              <div style={s.box}>
                <div style={s.boxHead}>Education</div>
                {cv.education.map((e) => (
                  <div key={e.degree}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{e.degree}</div>
                    <div style={{ fontSize: 12, color: "#777" }}>{e.institution} · {e.year}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={s.box}>
                <div style={s.boxHead}>Experience</div>
                {cv.experience.map((e) => (
                  <div key={e.role} style={s.expItem}>
                    <div style={s.expRole}>{e.role}</div>
                    <div style={s.expCo}>{e.company} · {e.duration}</div>
                    {e.bullets.map((b) => <div key={b} style={s.bullet}>· {b}</div>)}
                  </div>
                ))}
              </div>

              <div style={s.box}>
                <div style={s.boxHead}>Projects</div>
                {cv.projects.map((p) => (
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
