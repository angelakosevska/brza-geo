import { io } from "socket.io-client";

const DEV = import.meta.env.DEV;

const SOCKET_URL = DEV
  ? "http://localhost:5000"
  : import.meta.env.VITE_SOCKET_URL;

if (!DEV && !SOCKET_URL) {
  throw new Error("VITE_SOCKET_URL is not set in production");
}

export const socket = io(SOCKET_URL, {
  path: "/socket.io", 
  transports: ["websocket", "polling"], 
  autoConnect: false,
  auth: {
    token: localStorage.getItem("token"),
  }, 
});
socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
socket.on("disconnect", () => console.log("❌ Socket disconnected"));
