import { useState } from "react";
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

  const handleChange = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    handleReset(formData);
  };

  return (
    <GlassCard className="lg:max-w-[30vw] sm:max-w-[90vw]">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4 mx-auto p-4  w-full max-w-xs"
      >
        <h2 className="mb-2 font-extrabold text-[var(--primary)] text-xl sm:text-2xl md:text-3xl text-center">
          Промени ја лозинката
        </h2>

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
          placeholder="Внеси го кодот"
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
          placeholder="Потврди ја лозинката"
          autoComplete="new-password"
          value={formData.confirmPassword}
          onChange={handleChange("confirmPassword")}
          required
        />

        <Button type="submit" className="mt-4 w-full">
          Промени ја лозинката
        </Button>
      </form>
    </GlassCard>
  );
}
