import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import GlassCard from "../../components/global/GlassCard";

export default function ResetPasswordForm({ handleReset }) {
  const [formData, setFormData] = useState({
    email: "",
    resetCode: "",
    newPassword: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  const handleChange = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    handleReset(formData);
  };

  const handleBackToLogin = () => {
    navigate("/auth"); // ✅ back to login after reset
  };

  return (
    <GlassCard className="flex justify-center items-center w-full">
      <form
        onSubmit={onSubmit}
        className="flex flex-col items-center justify-center gap-4 p-4 sm:p-8 w-full"
      >
        <h2 className="mb-2 font-extrabold text-[var(--primary)] text-xl sm:text-2xl md:text-3xl text-center">
          Промени ја лозинката
        </h2>

        <div className="flex flex-col gap-4 w-full max-w-xs sm:max-w-sm">
          <Input
            type="email"
            placeholder="Е-пошта"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange("email")}
            required
          />

          <Input
            type="text"
            placeholder="Код за ресетирање"
            value={formData.resetCode}
            onChange={handleChange("resetCode")}
            required
          />

          <Input
            type="password"
            placeholder="Нова лозинка"
            autoComplete="new-password"
            value={formData.newPassword}
            onChange={handleChange("newPassword")}
            required
          />

          <Input
            type="password"
            placeholder="Потврди лозинка"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange("confirmPassword")}
            required
          />

          <Button type="submit" className="mt-2 w-full">
            Промени ја лозинката
          </Button>
        </div>

        <div className="mt-4 text-xs sm:text-sm text-center">
          <span className="mr-1 text-[var(--text)]">
            Се сети на лозинката?
          </span>
          <Button
            variant="link"
            className="p-0 h-auto font-semibold text-[var(--primary)]"
            type="button"
            onClick={handleBackToLogin}
          >
            Најави се
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
