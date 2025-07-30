// src/pages/ResetPasswordPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import api from "@/lib/axios";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleReset = async (formData) => {
    setError("");
    const { email, resetCode, newPassword, confirmPassword } = formData;

    try {
      const res = await api.post("/auth/reset-password", {
        email,
        resetCode,
        newPassword,
        confirmPassword,
      });
      alert(res.data.message);
      navigate("/auth"); // back to login
    } catch (err) {
      setError(err.response?.data?.message || "Error resetting password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <ResetPasswordForm handleReset={handleReset} />
      </div>
    </div>
  );
}
