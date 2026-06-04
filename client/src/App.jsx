import { useState } from "react";
import useAuth from "../context/useAuth";
import Layout from "../components/Layout";
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import JobHunter from "../pages/JobHunter";
import Assistant from "../pages/Assistant";
import Tracker from "../pages/Tracker";
import Profile from "../pages/Profile";

const AUTH_PAGES = { dashboard: Dashboard, jobs: JobHunter, assistant: Assistant, tracker: Tracker, profile: Profile };

export default function App() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState("landing");

  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", fontFamily: "'Roboto Mono', monospace", color: "#888",
        background: "#f7f6f3",
      }}>
        Loading...
      </div>
    );
  }

  // Not logged in -- show public pages
  if (!user) {
    if (page === "login") return <Login onNavigate={setPage} />;
    if (page === "signup") return <Signup onNavigate={setPage} />;
    return <Landing onNavigate={setPage} />;
  }

  // Logged in -- show app pages inside Layout
  const PageComponent = AUTH_PAGES[page] || Dashboard;

  return (
    <Layout page={page === "landing" ? "dashboard" : page} setPage={setPage}>
      <PageComponent setPage={setPage} />
    </Layout>
  );
}
