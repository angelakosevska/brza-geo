import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
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
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email);
  };

  const handleBackToLogin = () => {
    navigate("/auth"); 
  };

  return (
    <GlassCard className="flex justify-center items-center w-full">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center justify-center gap-4 p-4 sm:p-8 w-full"
      >
        <h2 className="mb-2 font-extrabold text-[var(--primary)] text-xl sm:text-2xl md:text-3xl text-center">
          Заборавена лозинка ?!
        </h2>

        <div className="flex flex-col gap-4 w-full max-w-xs sm:max-w-sm">
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
        </div>

        <p className="text-[var(--text)]/70 text-xs text-center max-w-xs">
          По испраќањето, провери ја е-поштата (и spam/junk папката).
        </p>

        {/* Back to login */}
        <div className="mt-4 text-xs sm:text-sm text-center">
          <span className="mr-1 text-[var(--text)]">Се сети на лозинката?</span>
          <Button
            variant="link"
            className="p-0 h-auto font-semibold text-[var(--primary)]"
            onClick={handleBackToLogin} 
            type="button"
          >
            Најави се
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
