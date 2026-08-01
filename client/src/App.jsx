import useAuth from "../context/useAuth";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2, Zap } from "lucide-react";

import Layout from "../components/Layout";

import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import Home from "../pages/Home";
import JobHunter from "../pages/JobHunter";
import Assistant from "../pages/Assistant";
import Tracker from "../pages/Tracker";
import Profile from "../pages/Profile";
import Admin from "../pages/Admin";

function SmartRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === "admin" ? "/admin" : "/dashboard"} replace />;
}

function PrivateLayout({ children }) {
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "var(--font-sans)",
          background: "var(--bg)",
          gap: 20,
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: "var(--accent-gradient)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--btn-accent-text)", marginBottom: 8,
        }}>
          <Zap size={28} />
        </div>
        <Loader2 size={24} style={{ color: "var(--accent)", animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}>Loading CareerPilot...</div>
      </div>
    );
  }

  return (
    <Routes>
      {!user ? (
        <>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          <Route
            path="/dashboard"
            element={
              <PrivateLayout>
                <Dashboard />
              </PrivateLayout>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateLayout>
                <Profile />
              </PrivateLayout>
            }
          />

          <Route
            path="/jobs"
            element={
              <PrivateLayout>
                <JobHunter />
              </PrivateLayout>
            }
          />

          <Route
            path="/assistant"
            element={
              <PrivateLayout>
                <Assistant />
              </PrivateLayout>
            }
          />

          <Route
            path="/tracker"
            element={
              <PrivateLayout>
                <Tracker />
              </PrivateLayout>
            }
          />

          <Route
            path="/home"
            element={
              <PrivateLayout>
                <Home />
              </PrivateLayout>
            }
          />

          <Route
            path="/admin"
            element={<Admin />}
          />

          <Route path="/" element={<SmartRedirect />} />
          <Route path="*" element={<SmartRedirect />} />
        </>
      )}
    </Routes>
  );
}