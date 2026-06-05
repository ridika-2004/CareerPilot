import axios from "axios";
import API_URL from "./config";

const api = axios.create({
  baseURL: API_URL,
});

// Attach auth token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default api;
