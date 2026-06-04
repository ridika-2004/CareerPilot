import { useState } from "react";
import JobCard from "../components/JobCard";
import API_URL from "../src/config";

const API = `${API_URL}/api/assistant`;

const s = {
  h1: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  sub: { color: "#888", fontSize: 13, marginBottom: 24 },
  row: { display: "flex", gap: 8, marginBottom: 24 },
  input: { flex: 1, border: "1px solid #ddd", borderRadius: 5, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", outline: "none" },
  btn: (disabled) => ({
    border: "1px solid #1a1a1a",
    borderRadius: 5,
    padding: "9px 20px",
    background: disabled ? "#888" : "#1a1a1a",
    color: "#fff",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 13,
    fontFamily: "inherit",
  }),
  loading: { color: "#888", fontSize: 13 },
  error: { color: "#999", fontSize: 13, padding: "12px 0" },
  empty: { color: "#888", fontSize: 13, textAlign: "center", padding: "32px 0" },
};

const getUserId = () => {
  let id = localStorage.getItem("user_id");
  if (!id) {
    id = "user_" + Math.random().toString(36).substring(2, 9);
    localStorage.setItem("user_id", id);
  }
  return id;
};

export default function JobHunter() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const search = async () => {
    if (!query.trim() || loading) return;

    setLoading(true);
    setSearched(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch(`${API}/hunt/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          user_id: getUserId(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setResults(data.jobs || []);
    } catch {
      setError("Network error. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
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
          disabled={loading}
        />
        <button style={s.btn(loading)} onClick={search} disabled={loading}>
          {loading ? "Hunting..." : "Search"}
        </button>
      </div>

      {loading && <div style={s.loading}>Hunting jobs and scoring fit against your CV...</div>}

      {error && <div style={s.error}>{error}</div>}

      {!loading && searched && !error && results.length === 0 && (
        <div style={s.empty}>No jobs found matching your profile. Try a broader query or upload your CV.</div>
      )}

      {!loading && searched && !error && results.length > 0 && (
        <div>
          <div style={{ color: "#888", fontSize: 12, marginBottom: 12 }}>{results.length} results — sorted by fit</div>
          {results.map((job, i) => <JobCard key={i} job={job} />)}
        </div>
      )}
    </div>
  );
}
