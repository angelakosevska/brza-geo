import { useState } from "react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Copy, Check, LogOut } from "lucide-react";

export default function RoomCodeCard({
  code,

  className,
}) {
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
    <GlassCard className={`flex justify-between p-4 w-full ${className ?? ""}`}>
      {/* Left: Label above code on lg, row on smaller */}
      <div className="flex flex-row lg:flex-col items-center lg:items-start gap-2">
        <h3 className="font-semibold text-[var(--secondary)] text-xl">
          Код на собата
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-bold text-[var(--primary)] text-2xl tracking-widest select-all">
            {code}
          </span>
          <Button
            variant="link"
            onClick={handleCopy}
            aria-label="Копирај го кодот на собата"
            className="hover:bg-[var(--secondary)]/10 p-2 rounded"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-300" />
            ) : (
              <Copy className="w-5 h-5 text-[var(--secondary)]" />
            )}
          </Button>
        </div>
        {copied && <span className="text-green-400 text-xs">Копирано!</span>}
      </div>
    </GlassCard>
  );
}
