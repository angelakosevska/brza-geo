import { createContext, useContext, useEffect, useState } from "react";
import {jwtDecode} from "jwt-decode";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        setUser({ username: decoded.username, id: decoded.userId });
        setToken(storedToken);
      } catch (err) {
        console.error("Invalid token");
        logout();
      }
    }
  }, []);

  const login = (jwtToken) => { 
    localStorage.setItem("token", jwtToken);
    const decoded = jwtDecode(jwtToken);
    setUser({ username: decoded.username, id: decoded.userId });
    setToken(jwtToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}