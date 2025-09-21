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
      className={`flex flex-col items-center gap-3 p-6 text-center ${className ?? ""}`}
    >
      {/* Label */}
      <h3 className="font-semibold text-[var(--secondary)] text-lg uppercase tracking-wide">
        Код на собата
      </h3>

      {/* Room code + copy button */}
      <div className="flex items-center gap-3">
        <span className="font-extrabold text-[var(--primary)] text-3xl tracking-[0.3em] select-all">
          {code}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          aria-label="Копирај го кодот на собата"
          className="hover:bg-[var(--secondary)]/20 rounded-full transition"
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
        <span className="text-green-400 text-xs animate-fade-in">
          ✔ Копирано во clipboard!
        </span>
      )}
    </GlassCard>
  );
}
