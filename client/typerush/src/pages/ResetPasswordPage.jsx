import { useNavigate } from "react-router-dom";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import api from "@/lib/axios";
import { useLoading } from "@/context/LoadingContext";
import { useError } from "@/hooks/useError";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { setLoading } = useLoading();
  const { showError, showSuccess } = useError();

  // Handle password reset with reset code
  const handleReset = async (formData) => {
    const { email, resetCode, newPassword, confirmPassword } = formData;

    try {
      setLoading(true);
      const res = await api.post("/auth/reset-password", {
        email,
        resetCode,
        newPassword,
        confirmPassword,
      });
      showSuccess(res.data.message);
      navigate("/auth"); // back to login
    } catch (err) {
      const msg = err.response?.data?.message || "Error resetting password";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md">
        {/* ResetPasswordForm handles inputs for email, code, and new password */}
        <ResetPasswordForm handleReset={handleReset} />
      </div>
    </div>
  );
}
