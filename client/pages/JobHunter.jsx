import { useState } from "react";
import JobCard from "../components/JobCard";
import useAuth from "../context/useAuth";
import API_URL from "../src/config";
import { Search, Briefcase, Loader2, SearchX } from "lucide-react";

const API = `${API_URL}/api/assistant`;
const STORAGE_KEY = (userId) => `jobhunter_${userId}`;

function loadCache(userId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId));
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.debug(e);
  }
  return null;
}
function saveCache(userId, query, results) {
  try {
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify({ query, results, ts: Date.now() }));
  } catch (e) {
    console.debug(e);
  }
}

const getUserId = (user) => user?.user_id?.toString() || "anonymous";

export default function JobHunter() {
  const { user } = useAuth();
  const userId = getUserId(user);
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
        body: JSON.stringify({ query: query.trim(), user_id: getUserId(user) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); return; }
      setResults(data.jobs || []);
      saveCache(userId, query.trim(), data.jobs || []);
    } catch {
      setError("Network error. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const scored = results.filter(j => j.fit != null || j.relevance != null);

  return (
    <div className="anim-fade-up">
      {/* Header */}
      {/* <div style={s.header}>
        <div style={s.headerIcon}>
          <Briefcase size={20} strokeWidth={2} />
        </div>
        <div>
          <h1 style={s.h1}>Job Hunter</h1>
          <p style={s.sub}>Search real jobs from the web. Results ranked by how well they match your query + CV.</p>
        </div>
      </div> */}

      {/* Search Bar */}
      <div style={s.searchBox} className="anim-fade-up anim-fade-up-d1">
        <Search size={18} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
        <input
          style={s.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder='e.g. "Find me ML internships in Dhaka open this month"'
          disabled={loading}
        />
        <button style={s.btn(loading)} onClick={search} disabled={loading}>
          {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Hunting...</> : "Search Jobs"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={s.loadingWrap} className="anim-fade-in">
          <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: "var(--accent)" }} />
          <span style={s.loadingText}>Searching real job boards, analyzing query match, and scoring against your CV...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={s.errorBox}>
          <div style={s.errorDot} />
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && searched && !error && results.length === 0 && (
        <div style={s.emptyState} className="anim-fade-up">
          <SearchX size={28} style={{ color: "var(--text-faint)", marginBottom: 10 }} />
          <div style={s.emptyTitle}>No jobs found</div>
          <div style={s.emptyDesc}>Try broader terms like "software engineer remote" or "data analyst".</div>
        </div>
      )}

      {/* Results */}
      {!loading && searched && !error && (() => {
        if (scored.length === 0) {
          return (
            <div style={s.emptyState} className="anim-fade-up">
              <SearchX size={28} style={{ color: "var(--text-faint)", marginBottom: 10 }} />
              <div style={s.emptyTitle}>No matching jobs</div>
              <div style={s.emptyDesc}>Try broader terms like "software engineer" or "data analyst".</div>
            </div>
          );
        }
        return (
          <div className="anim-fade-up">
            <div style={s.resultCount}>
              <Briefcase size={14} />
              {scored.length} jobs matched to your CV — ranked by query match & CV fit
            </div>
            {scored.map((job, i) => <JobCard key={i} job={job} />)}
          </div>
        );
      })()}
    </div>
  );
}

const s = {
  header: { display: "flex", gap: 14, marginBottom: 24, alignItems: "flex-start" },
  headerIcon: {
    width: 42, height: 42, borderRadius: 12, background: "var(--accent-light)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--accent)", flexShrink: 0,
  },
  h1: { fontSize: 22, fontWeight: 700, marginBottom: 2, color: "var(--text-primary)", letterSpacing: "-0.3px" },
  sub: { color: "var(--text-muted)", fontSize: 14 },

  searchBox: {
    display: "flex", alignItems: "center", gap: 10,
    background: "var(--bg-card)", border: "1.5px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "6px 6px 6px 16px",
    marginBottom: 24, transition: "border-color 0.2s",
    boxShadow: "var(--shadow-sm)",
  },
  input: {
    flex: 1, border: "none", padding: "10px 8px", fontSize: 14,
    fontFamily: "var(--font-sans)", outline: "none", background: "transparent",
    color: "var(--text-primary)",
  },
  btn: (disabled) => ({
    display: "flex", alignItems: "center", gap: 6,
    border: "none", borderRadius: "var(--radius-md)",
    padding: "10px 20px",
    background: disabled ? "var(--text-faint)" : "var(--accent-gradient)",
    color: "var(--btn-accent-text)", cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 13, fontWeight: 600, fontFamily: "var(--font-sans)",
    whiteSpace: "nowrap", flexShrink: 0,
    boxShadow: disabled ? "none" : "0 2px 8px rgba(0,0,0,0.15)",
  }),

  loadingWrap: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "16px 0",
  },
  loadingText: { color: "var(--text-muted)", fontSize: 13 },

  errorBox: {
    display: "flex", alignItems: "center", gap: 8,
    background: "var(--danger-light)", border: "1px solid #fecaca",
    borderRadius: "var(--radius-md)", padding: "10px 14px",
    fontSize: 13, color: "#b91c1c", marginBottom: 16,
  },
  errorDot: { width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0 },

  emptyState: {
    textAlign: "center", padding: "48px 20px",
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
  },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: "var(--text-muted)" },

  resultCount: {
    display: "flex", alignItems: "center", gap: 8,
    color: "var(--text-muted)", fontSize: 13, marginBottom: 16, fontWeight: 500,
  },
};
