import useAuth from "../context/useAuth";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

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

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
