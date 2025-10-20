import { useState } from "react";
import GlassCard from "@/components/global/GlassCard";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export default function RoomCodeCard({ code, className }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      console.error("❌ Failed to copy room code");
    }
  };

  return (
    <GlassCard
      className={`flex flex-col lg:flex-col md:flex-row items-center justify-center gap-1 md:gap-6 p-6 text-center md:text-left ${className ?? ""}`}
    >
      {/* Label */}
      <h3
        className="
          font-medium uppercase tracking-wide
          text-[var(--secondary)]
          text-sm sm:text-base md:text-lg
        "
      >
        Код на собата
      </h3>

      {/* Room code + copy button */}
      <div className="flex items-center justify-center gap-3">
        <span
          className="
            font-bold text-[var(--primary)]
            text-lg sm:text-xl md:text-2xl
            tracking-[0.25em] select-all
          "
        >
          {code}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          aria-label="Копирај го кодот на собата"
          className="
            hover:bg-[var(--secondary)]/20 
            rounded-full transition
          "
        >
          {copied ? (
            <Check className="w-5 h-5 text-green-400" />
          ) : (
            <Copy className="w-5 h-5 text-[var(--secondary)]" />
          )}
        </Button>
      </div>

      {/* Feedback */}
      {copied && (
        <span className="text-green-400 text-xs sm:text-sm md:text-base animate-fade-in">
          ✔ Копирано во clipboard!
        </span>
      )}
    </GlassCard>
  );
}
