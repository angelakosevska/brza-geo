import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import api from "@/lib/axios";
import { useNavigate } from "react-router-dom";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const handleResetRequest = async (email) => {
    try {
      const res = await api.post("/auth/request-password-reset", { email });
      alert(res.data.message); // ✅ show success

      navigate("/reset-password");
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong";
      alert(msg);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
      <ForgotPasswordForm onSubmit={handleResetRequest} />
    </div>
  );
}
