import useAuth from "../context/useAuth";
import { Routes, Route, Navigate } from "react-router-dom";

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
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "'Roboto Mono', monospace",
          background: "#f7f6f3",
          color: "#888",
        }}
      >
        Loading...
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