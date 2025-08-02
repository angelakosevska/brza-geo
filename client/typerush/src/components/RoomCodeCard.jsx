import { useState } from "react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react"; // or your preferred icon lib

export default function RoomCodeCard({ code, className }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback or error handling
    }
  };

  return (
    
   <GlassCard className={`flex flex-row items-center p-4 w-full ${className ?? ""}`}>
      <h3 className="font-semibold text-[var(--secondary)] text-xl text-center">
        Room Code
      </h3>
      <div className="flex items-center gap-2">
        <span className="font-bold text-[var(--primary)] text-2xl text-center tracking-widest select-all">
          {code}
        </span>
        <Button
          variant="link"
          onClick={handleCopy}
          aria-label="Copy room code"
          className="hover:bg-[var(--secondary)]/10 transition"
        >
          {copied ? (
            <Check className="w-5 h-5 text-green-300" />
          ) : (
            <Copy className="w-5 h-5 text-[var(--secondary)]" />
          )}
        </Button>
      </div>
      {copied && (
        <span className="mt-[-0.5rem] text-green-400 text-xs">Copied!</span>
      )}
    </GlassCard>
  );
}
