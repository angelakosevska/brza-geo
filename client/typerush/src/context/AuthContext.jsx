import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { resetSessionErrorGuard } from "@/lib/axios"; // reset guard on login
import { socket } from "@/lib/socket";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        // Decode token to check expiry
        const decoded = jwtDecode(storedToken);
        const now = Date.now() / 1000; // current time in seconds

        if (decoded.exp && decoded.exp < now) {
          // Token is expired -> clear auth
          console.warn("Stored JWT is expired. Logging out user.");
          logout();
        } else {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          socket.auth = { token: storedToken };
          socket.connect();
        }
      } catch (err) {
        console.error("Invalid stored token or user data", err);
        logout();
      }
    }
  }, []);

  const login = (jwtToken, userData) => {
    localStorage.setItem("token", jwtToken);
    localStorage.setItem("user", JSON.stringify(userData));

    setToken(jwtToken);
    setUser(userData);
    resetSessionErrorGuard();

    socket.auth = { token: jwtToken };
    socket.connect();
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    if (socket.connected) socket.disconnect();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
