import axios from "axios";

const DEV = import.meta.env.DEV;
export const API_BASE = DEV
  ? "http://localhost:5000/api"
  : "https://brza-geo.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": "mk",
  },
});

// Add Authorization header with JWT if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Placeholders for navigate and error toast (injected from React)
let navigateFn = null;
let showErrorFn = null;
let hasShownSessionError = false; // guard to prevent multiple toasts

// Called from React app root to provide navigate + showError to Axios
export function setAxiosUtils({ navigate, showError }) {
  navigateFn = navigate;
  showErrorFn = showError;
}

// Global response interceptor
// - Handles expired or invalid JWT
// - Clears token
// - Shows error toast (only once)
// - Redirects to /auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      localStorage.removeItem("token");

      if (!hasShownSessionError && showErrorFn) {
        hasShownSessionError = true;
        showErrorFn("Сесијата заврши. Најави се повторно.");
      }

      if (navigateFn) {
        navigateFn("/auth");
      }
    }
    return Promise.reject(error);
  }
);

export function resetSessionErrorGuard() {
 
  hasShownSessionError = false;
}

export default api;
