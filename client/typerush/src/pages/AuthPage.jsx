import React, { useState } from "react";
import clsx from "clsx";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [flipped, setFlipped] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginData.email,
          password: loginData.password,
        }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user._id); // ✅ Add this
        localStorage.setItem("username", data.user.username);
        alert("Login successful!");
        navigate("/main");
      } else {
        alert(data.message || "Login error");
      }
    } catch (err) {
      alert("Server error");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword)
      return alert("Passwords do not match!");

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerData.email,
          password: registerData.password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Registration successful! Now login.");
        setFlipped(false);
      } else {
        alert(data.message || "Register error");
      }
    } catch (err) {
      alert("Server error");
    }
  };

  return (
    <>
      <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md h-[400px] sm:h-[440px] md:h-[480px] flex items-center justify-center">
        <div
          className={clsx(
            "relative w-full h-full rounded-4xl transition-transform duration-800 shadow-xl border border-[var(--background)] bg-[var(--background)]/20"
          )}
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div
            className="absolute inset-0 flex justify-center items-center backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <LoginForm
              loginData={loginData}
              setLoginData={setLoginData}
              handleLogin={handleLogin}
              onFlip={() => setFlipped(true)}
            />
          </div>
          <div
            className="absolute inset-0 flex justify-center items-center backface-hidden"
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
