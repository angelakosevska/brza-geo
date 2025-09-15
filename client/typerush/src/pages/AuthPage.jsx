import React, { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { useError } from "@/hooks/useError";
import GlassCard from "@/components/global/GlassCard";
import { AnimatePresence, motion } from "framer-motion";
import { useLoading } from "@/context/LoadingContext";

export default function AuthPage() {
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showError, showSuccess } = useError();
  const { setLoading } = useLoading();

  // Handle registration
  const handleRegister = async (_e, data) => {
    try {
      setLoading(true);
      const res = await api.post("/auth/register", data);
      const { token } = res.data;
      login(token);
      showSuccess("Registration successful!");
      navigate("/main");
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = async (_e, data) => {
    try {
      setLoading(true);
      const res = await api.post("/auth/login", {
        login: data.login,
        password: data.password,
      });
      const { token, user } = res.data;
      login(token, user);
      showSuccess("Welcome back!");
      navigate("/main");
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to forgot password page
  const handleForgotPassword = () => {
    navigate("/auth/forgot-password");
  };

  return (
    <div className="relative flex justify-center items-center w-full min-h-screen">
      <GlassCard className="p-6 w-full max-w-xs sm:max-w-sm md:max-w-md">
        <AnimatePresence mode="wait">
          {/* Login card */}
          {!showRegister ? (
            <motion.div
              key="login"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <LoginForm
                handleLogin={handleLogin}
                onFlip={() => setShowRegister(true)}
                onForgotPassword={handleForgotPassword}
              />
            </motion.div>
          ) : (
            // Register card
            <motion.div
              key="register"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <RegisterForm
                handleRegister={handleRegister}
                onFlip={() => setShowRegister(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}
