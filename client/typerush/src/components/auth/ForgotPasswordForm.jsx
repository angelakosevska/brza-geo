import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import GlassCard from "../global/GlassCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
          placeholder="Внеси го твојот е-маил"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="mt-2 w-full" type="submit">
                Испрати лозинка
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Провери ја е-поштата (и spam/junk папката)
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <p className="text-[var(--text)]/70 text-xs text-center">
          По испраќањето, провери ја е-поштата (и spam/junk папката).
        </p>
      </form>
    </GlassCard>
  );
}
