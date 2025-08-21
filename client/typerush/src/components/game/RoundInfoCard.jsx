import GlassCard from "@/components/GlassCard";

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Round X / Y */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text)] uppercase tracking-wide opacity-70">
            Round
          </span>
          <span className="font-medium text-[var(--text)]">
            {currentRound || "-"} / {totalRounds || "-"}
          </span>
        </div>

        {/* Center: Letter */}
        <div className="flex justify-center">
          <div className="flex items-center justify-center">
            <span className="opacity-70 text-[var(--text)] uppercase text-xs mr-3 hidden sm:inline">
              Letter
            </span>
            <span className="font-extrabold text-4xl text-[var(--secondary)] sm:text-5xl tracking-widest">
              {waiting ? "—" : letter ?? "—"}
            </span>
          </div>
        </div>

        {/* Right: Timer */}
        <div className="flex items-center justify-end">
          <div className="text-[var(--accent)]">
            {timeLeft != null ? `${timeLeft}s` : "--"}
          </div>
        </div>
      </div>

      {/* Helper line for pre-round state */}
      {waiting && (
        <div className="mt-3 text-center text-sm  text-[var(--text)] opacity-70">
          Waiting for the round to start…
        </div>
      )}
    </GlassCard>
  );
}
