import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";

export default function FinalResultsModal({
  show = false,
  code, // room code (optional display)
  playerNameById = {}, // { [id]: "Alice" }
  finalTotals = {}, // { [id]: number }
  finalWinners = [], // [id, id, ...] handle ties
  isHost = false,

  // Actions
  onBackToRoom, // () => void  (go to RoomPage)
  onLeaveToMain, // () => void  (leave room + go home)
  onStartNewGame, // () => void  (host only)
  onRequestClose, // () => void  (optional)
}) {
  if (!show) return null;

  const sorted = Object.entries(finalTotals).sort((a, b) => b[1] - a[1]);
  const winnerNames =
    finalWinners.length > 0
      ? finalWinners
          .map((id) => playerNameById[id] || String(id).slice(-5))
          .join(", ")
      : null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="final-results-title"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onRequestClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <GlassCard className="relative w-full max-w-3xl p-6 text-[var(--text)]">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div id="final-results-title" className="text-xl font-bold">
              Играта заврши
            </div>
            {code && (
              <div className="text-sm opacity-70 uppercase">Соба {code}</div>
            )}
          </div>

          {/* Winner(s) */}
          <div className="mb-4">
            {winnerNames ? (
              <div className="text-lg">
                Победни{finalWinners.length > 1 ? "ци" : "к"}:{" "}
                <span className="font-semibold text-[var(--secondary)]">
                  {winnerNames}
                </span>
              </div>
            ) : (
              <div className="text-lg">Нема победници</div>
            )}
          </div>

          {/* Final scores (vkupno bodovi) */}
          <div className="mb-2 text-sm font-medium">Финални поени</div>
          <div className="max-h-[55vh] space-y-2 overflow-auto pr-1">
            {sorted.map(([pid, pts]) => {
              const isWinner = finalWinners.includes(pid);
              return (
                <div
                  key={pid}
                  className={`flex items-center justify-between rounded-2xl px-5 py-3 bg-[var(--primary)]/10`}
                >
                  <div className="font-medium">
                    {playerNameById[pid] || String(pid).slice(-5)}
                  </div>
                  <div className="font-mono">#{pts}</div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={onLeaveToMain}
              title="Leave to main"
            >
              Leave to Main
            </Button>
            <Button
              variant="outline"
              onClick={onBackToRoom}
              title="Back to room"
            >
              Back to Room
            </Button>
            {isHost && (
              <Button
                onClick={onStartNewGame}
                title="Start another game with the same settings"
              >
                Start New Game
              </Button>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
