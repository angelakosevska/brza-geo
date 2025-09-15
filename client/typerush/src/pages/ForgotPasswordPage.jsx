import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import api from "@/lib/axios";
import { useNavigate } from "react-router-dom";
import { useLoading } from "@/context/LoadingContext";
import { useError } from "@/hooks/useError";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { setLoading } = useLoading();
  const { showError, showSuccess } = useError();

  // Handle request for password reset
  const handleResetRequest = async (email) => {
    try {
      setLoading(true);
      const res = await api.post("/auth/request-password-reset", { email });
      showSuccess(res.data.message);
      navigate("/reset-password");
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      {/* ForgotPasswordForm handles the input field + submit button */}
      <ForgotPasswordForm onSubmit={handleResetRequest} />
    </div>
  );
}
