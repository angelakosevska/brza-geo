import React, { useState } from "react";
import clsx from "clsx";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

export default function AuthPage() {
  const [flipped, setFlipped] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await api.post("/auth/register", {
      username: registerData.username,
      email: registerData.email,
      password: registerData.password,
      confirmPassword: registerData.confirmPassword,
    });
    const { token } = res.data;
    login(token);
    navigate("/main");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", {
        login: loginData.email,
        password: loginData.password,
      });

      const { token } = res.data;
      login(token);

      navigate("/main");
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      alert(message);
    }
  };

  const handleForgotPassword = () => {
    navigate("/auth/forgot-password");
  };

  return (
    <>
      <div className="relative flex justify-center items-center w-full max-w-xs sm:max-w-sm md:max-w-md h-[400px] sm:h-[440px] md:h-[480px]">
        <div
          className={clsx(
            "relative bg-[var(--background)]/20 shadow-xl border border-[var(--background)] rounded-4xl w-full h-full transition-transform duration-800"
          )}
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div
            className="absolute inset-0 flex justify-center items-center bg-[var(--background)]/30 shadow-gray-500/20 shadow-xl backdrop-blur-sm border border-[var(--background)] rounded-3xl backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <LoginForm
              loginData={loginData}
              setLoginData={setLoginData}
              handleLogin={handleLogin}
              onFlip={() => setFlipped(true)}
              onForgotPassword={handleForgotPassword}
            />
          </div>
          <div
            className="absolute inset-0 flex justify-center items-center bg-[var(--background)]/30 shadow-gray-500/20 shadow-xl backdrop-blur-sm p-4 border border-[var(--background)] rounded-3xl backface-hidden"
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
            }}
          >
            <RegisterForm
              registerData={registerData}
              setRegisterData={setRegisterData}
              handleRegister={handleRegister}
              onFlip={() => setFlipped(false)}
            />
          </div>
        </div>
      </div>
      <style>{`.backface-hidden { backface-visibility: hidden; }`}</style>
    </>
  );
}
