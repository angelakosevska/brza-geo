import axios from "axios";

const DEV = import.meta.env.DEV;
export const API_BASE = DEV
  ? "http://localhost:5000"
  : import.meta.env.VITE_API_URL; // e.g. https://your-backend.render.app

const api = axios.create({
  baseURL: API_BASE, 
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": "mk",
  },

});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
