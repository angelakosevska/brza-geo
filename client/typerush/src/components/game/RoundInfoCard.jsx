import GlassCard from "@/components/global/GlassCard";

export default function RoundInfoCard({
  currentRound,
  totalRounds,
  timeLeft,
  letter,
  waiting = false,
  className = "",
}) {
  return (
    <GlassCard
      className={`px-4 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-5 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-center text-[var(--text)] sm:gap-12 lg:gap-16">
        <div className="grid grid-cols-3 sm:flex sm:flex-row items-center justify-center w-full text-center">
          {/* Round */}
          <div className="flex flex-col items-center leading-tight sm:mx-6 lg:mx-8">
            <span className="text-[10px] sm:text-xs uppercase opacity-60 tracking-wide">
              Рунда
            </span>
            <span className="font-semibold text-sm sm:text-base lg:text-lg">
              {currentRound || "-"} / {totalRounds || "-"}
            </span>
          </div>

          {/* Letter */}
          <div className="flex flex-col items-center justify-center leading-none sm:mx-10 lg:mx-14">
            <span className="text-[10px] sm:text-xs uppercase opacity-60 tracking-wide mb-0.5">
              Буква
            </span>
            <span className="font-extrabold text-[var(--secondary)] text-3xl sm:text-4xl lg:text-5xl tracking-[0.1em]">
              {waiting ? "—" : letter ?? "—"}
            </span>
          </div>

          {/* Timer */}
          <div className="flex flex-col items-center leading-tight sm:mx-6 lg:mx-8">
            <span className="text-[10px] sm:text-xs uppercase opacity-60 tracking-wide">
              Време
            </span>
            <span
              className={`font-semibold text-base sm:text-lg lg:text-xl ${
                timeLeft <= 5
                  ? "text-red-500 animate-pulse"
                  : "text-[var(--accent)]"
              }`}
            >
              {timeLeft != null ? `${timeLeft}s` : "--"}
            </span>
          </div>
        </div>
      </div>

      {waiting && (
        <div className="opacity-70 mt-2 text-xs sm:text-sm text-center">
          Започнува нова рунда...
        </div>
      )}
    </GlassCard>
  );
}
