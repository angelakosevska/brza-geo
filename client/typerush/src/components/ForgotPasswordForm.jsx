import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordForm({ onSubmit }) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 p-5 sm:p-8 w-full max-w-xs mx-auto"
    >
      <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-2 text-[var(--primary)] text-center">
        Forgot Password 🔐
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
        Send Reset Link
      </Button>
    </form>
  );
}
