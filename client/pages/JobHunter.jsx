import { useState } from "react";
import JobCard from "../components/JobCard";
import useAuth from "../context/useAuth";
import API_URL from "../src/config";

const API = `${API_URL}/api/assistant`;

const STORAGE_KEY = (userId) => `jobhunter_${userId}`;

function loadCache(userId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveCache(userId, query, results) {
  try {
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify({ query, results, ts: Date.now() }));
  } catch { /* ignore */ }
}

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

const getUserId = (user) => {
  return user?.user_id?.toString() || "anonymous";
};

export default function JobHunter() {
  const { user } = useAuth();
  const userId = getUserId(user);

  // Restore cached results on mount
  const cached = loadCache(userId);
  const [query, setQuery] = useState(cached?.query || "");
  const [results, setResults] = useState(cached?.results || []);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!cached?.results?.length);
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
          user_id: getUserId(user),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setResults(data.jobs || []);
      saveCache(userId, query.trim(), data.jobs || []);
    } catch {
      setError("Network error. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={s.h1}>Job Hunter</div>
      <div style={s.sub}>Search real jobs from the web. Results ranked by how well they match your query + CV.</div>

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

      {loading && <div style={s.loading}>Searching real job boards, analyzing query match, and scoring against your CV...</div>}

      {error && <div style={s.error}>{error}</div>}

      {!loading && searched && !error && results.length === 0 && (
        <div style={s.empty}>No real jobs found for this query. Try broader terms like "software engineer remote" or "data analyst".</div>
      )}

      {!loading && searched && !error && (() => {
        // Only show jobs that have been scored (have fit or relevance)
        const scored = results.filter(j => j.fit != null || j.relevance != null);
        if (scored.length === 0) {
          return <div style={s.empty}>No matching jobs found for this query. Try broader terms like "software engineer" or "data analyst".</div>;
        }
        return (
          <div>
            <div style={{ color: "#888", fontSize: 12, marginBottom: 12 }}>
              {scored.length} jobs matched to your CV — ranked by query match & CV fit
            </div>
            {scored.map((job, i) => <JobCard key={i} job={job} />)}
          </div>
        );
      })()}
    </div>
  );
}
