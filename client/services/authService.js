import axios from "axios";
import api from "../src/api";
import API_URL from "../src/config";

const API = `${API_URL}/api/users`;

const authService = {
  async register({ username, email, password, full_name }) {
    const res = await axios.post(`${API}/register/`, {
      username,
      email,
      password,
      full_name,
    });
    return res.data;
  },

  async login({ username, password }) {
    const res = await axios.post(`${API}/login/`, { username, password });
    return res.data;
  },

  async me(token) {
    const res = await api.get(`/api/users/me/`, {
      headers: { Authorization: `Token ${token}` },
    });
    return res.data;
  },

  async logout(token) {
    try {
      await api.post(`/api/users/logout/`, null, {
        headers: { Authorization: `Token ${token}` },
      });
    } catch {
      // ignore
    }
  },

  saveSession(data) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("username", data.username);
    localStorage.setItem("email", data.email);
    localStorage.setItem("full_name", data.full_name || "");
  },

  clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("full_name");
  },

  getToken() {
    return localStorage.getItem("token");
  },

  isAuthenticated() {
    return !!localStorage.getItem("token");
  },
};

export default authService;
