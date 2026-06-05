import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import authService from "../services/authService";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => authService.isAuthenticated());

  useEffect(() => {
    const token = authService.getToken();
    if (!token) return;
    let cancelled = false;
    authService
      .me(token)
      .then((data) => { if (!cancelled) setUser(data); })
      .catch(() => authService.clearSession())
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    authService.saveSession(data);
    setUser({
      user_id: data.user_id,
      username: data.username,
      email: data.email,
      full_name: data.full_name,
      role: data.role || "user",
    });
    return data;
  }, []);

  const register = useCallback(async (credentials) => {
    const data = await authService.register(credentials);
    authService.saveSession(data);
    setUser({
      user_id: data.user_id,
      username: data.username,
      email: data.email,
      full_name: data.full_name,
      role: data.role || "user",
    });
    return data;
  }, []);

  const logout = useCallback(async () => {
    const token = authService.getToken();
    await authService.logout(token);
    authService.clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
