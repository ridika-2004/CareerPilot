import { useState } from "react";
import JobCard from "../components/JobCard";

const MOCK_RESULTS = [
  { role: "ML Engineer Intern", company: "Brain Labs BD", location: "Dhaka", salary: "BDT 25k–35k/mo", deadline: "Jun 30", fit: 84, reason: "Matches your Python, TensorFlow skills and 2 ML project experiences. Location matches. Junior-level aligns with your 1 YoE." },
  { role: "Data Scientist", company: "DataMind", location: "Dhaka (Remote)", salary: "BDT 40k–60k/mo", deadline: "Jul 5", fit: 71, reason: "Strong overlap on data analysis and pandas. Missing: production ML deployment experience listed in JD." },
  { role: "Backend Engineer", company: "ShopX", location: "Dhaka", salary: "BDT 50k–70k/mo", deadline: "Jun 25", fit: 38, reason: "Low fit — JD requires 3+ years Node.js. Your CV shows Django/Python primarily with no Node experience." },
];

const s = {
  h1: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  sub: { color: "#888", fontSize: 13, marginBottom: 24 },
  row: { display: "flex", gap: 8, marginBottom: 24 },
  input: { flex: 1, border: "1px solid #ddd", borderRadius: 5, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", outline: "none" },
  btn: { border: "1px solid #1a1a1a", borderRadius: 5, padding: "9px 20px", background: "#1a1a1a", color: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
  loading: { color: "#888", fontSize: 13 },
};

export default function JobHunter() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    // Simulate API call
    setTimeout(() => {
      setResults(MOCK_RESULTS);
      setLoading(false);
    }, 1200);
  };

  return (
    <div>
      <div style={s.h1}>Job Hunter</div>
      <div style={s.sub}>Search in plain English. The agent finds, filters, and scores against your CV.</div>

      <div style={s.row}>
        <input
          style={s.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder='e.g. "Find me ML internships in Dhaka open this month"'
        />
        <button style={s.btn} onClick={search}>Search</button>
      </div>

      {loading && <div style={s.loading}>Hunting jobs and scoring fit against your CV...</div>}

      {!loading && searched && (
        <div>
          <div style={{ color: "#888", fontSize: 12, marginBottom: 12 }}>{results.length} results — sorted by fit</div>
          {results.map((job, i) => <JobCard key={i} job={job} />)}
        </div>
      )}
    </div>
  );
}
