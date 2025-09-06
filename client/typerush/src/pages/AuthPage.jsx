import React, { useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { useError } from "@/hooks/useError";
import GlassCard from "@/components/GlassCard";
import { AnimatePresence, motion } from "framer-motion";

export default function AuthPage() {
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showError, showSuccess } = useError();

  const handleRegister = async (_e, data) => {
    try {
      const res = await api.post("/auth/register", data);
      const { token } = res.data;
      login(token);
      showSuccess("Регистрацијата беше успешна!");
      navigate("/main");
    } catch (err) {
      const message = err.response?.data?.message || "Регистрацијата не успеа";
      showError(message);
    }
  };

  const handleLogin = async (_e, data) => {
    try {
      const res = await api.post("/auth/login", {
        login: data.login, // 👈 ова е поле од LoginForm
        password: data.password,
      });
      const { token } = res.data;
      login(token);
      showSuccess("Добредојде назад!");
      navigate("/main");
    } catch (err) {
      const message = err.response?.data?.message || "Најавата не успеа";
      showError(message);
    }
  };

  const handleForgotPassword = () => {
    navigate("/auth/forgot-password");
  };

  return (
    <div className="relative flex justify-center items-center w-full min-h-screen">
      <GlassCard className="p-6 w-full max-w-xs sm:max-w-sm md:max-w-md">
        <AnimatePresence mode="wait">
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
