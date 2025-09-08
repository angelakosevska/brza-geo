import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import GlassCard from "../global/GlassCard";

export default function ForgotPasswordForm({ onSubmit }) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email);
  };

  return (
    <GlassCard>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 mx-auto p-4 w-full max-w-xs"
      >
        <h2 className="mb-2 font-extrabold text-[var(--primary)] text-xl sm:text-2xl md:text-3xl text-center">
          Заборавена лозинка
        </h2>

        <Input
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button className="mt-2 w-full" type="submit">
          Испрати линк за промена на лозинка
        </Button>
      </form>
    </GlassCard>
  );
}
