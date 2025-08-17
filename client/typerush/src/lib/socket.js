import { io } from "socket.io-client";

const DEV = import.meta.env.DEV;

const SOCKET_URL = DEV
  ? "http://localhost:5000"
  : import.meta.env.VITE_SOCKET_URL; 

if (!DEV && !SOCKET_URL) {
  // Helpful error if you forget to set it on Vercel
  throw new Error("VITE_SOCKET_URL is not set in production");
}

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  path: "/socket.io",
  // withCredentials: true, // <- enable ONLY if you actually use cookies/sessions
  // auth: { token: localStorage.getItem("token") } // <- if you pass JWT via socket auth
});
