import GlassCard from "@/components/global/GlassCard";

export default function RoundInfoCard({
  currentRound,
  totalRounds,
  timeLeft, // number in seconds (or null/undefined before round)
  letter, // string like "A" (or null before round)
  waiting = false,
  className = "",
}) {
  return (
    <GlassCard className={`p-4 lg:p-6 ${className}`}>
      <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4">
        {/* Left: Round X / Y */}
        <div className="flex items-center gap-2">
          <span className="opacity-70 text-[var(--text)] text-xs uppercase tracking-wide">
            Round
          </span>
          <span className="font-medium text-[var(--text)]">
            {currentRound || "-"} / {totalRounds || "-"}
          </span>
        </div>

        {/* Center: Letter */}
        <div className="flex justify-center">
          <div className="flex justify-center items-center">
            <span className="hidden sm:inline opacity-70 mr-3 text-[var(--text)] text-xs uppercase">
             Буква
            </span>
            <span className="font-extrabold text-[var(--secondary)] text-4xl sm:text-5xl tracking-widest">
              {waiting ? "—" : letter ?? "—"}
            </span>
          </div>
        </div>

        {/* Right: Timer */}
        <div className="flex justify-end items-center">
          <div className="text-[var(--accent)]">
            {timeLeft != null ? `${timeLeft}s` : "--"}
          </div>
        </div>
      </div>

      {/* Helper line for pre-round state */}
      {waiting && (
        <div className="opacity-70 mt-3 text-[var(--text)] text-sm text-center">
         Започнува нова рунда...
        </div>
      )}
    </GlassCard>
  );
}
