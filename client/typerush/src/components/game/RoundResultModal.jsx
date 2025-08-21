import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";

export default function RoundResultsModal({
  show = false,
  isHost = false,
  currentRound = 1,
  totalRounds = 1,

  // Data
  categories = [], // ["animals", "cities", ...]
  categoryLabels = {}, // { animals: "Animals", ... }
  players = [], // array of player ids or objects
  playerNameById = {}, // { playerId: "Alice", ... }
  answerDetails = {}, // { [playerId]: { [categoryId]: { value, valid, unique, points } } }
  roundScores = {}, // { [playerId]: number }

  // Optional break countdown
  breakLeft = null, // seconds (null to hide)

  // Actions
  onNextRound, // () => void (host only)
  onRequestClose, // () => void (optional)
}) {
  if (!show) return null;

  const normalizeId = (p) =>
    typeof p === "string" ? p : p?._id ?? String(p ?? "");

  const roundTotals = Object.entries(roundScores)
    .map(([id, pts]) => ({
      id,
      pts,
      name: playerNameById[id] || String(id).slice(-5),
    }))
    .sort((a, b) => b.pts - a.pts);

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="round-results-title"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onRequestClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <GlassCard className="w-full max-w-3xl p-6 text-[var(--text)] relative">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div id="round-results-title" className="font-bold text-lg">
              Round {currentRound} Results
            </div>
            <div className="flex items-center gap-3">
              {breakLeft != null && (
                <div className="text-sm opacity-70">
                  Next round in {breakLeft}s
                </div>
              )}
              {isHost && currentRound < totalRounds && (
                <Button
                  onClick={onNextRound}
                  size="sm"
                  title="Start next round now"
                >
                  Start next round
                </Button>
              )}
            </div>
          </div>

          {/* Per-category answers */}
          <div className="grid gap-4 max-h-[55vh] overflow-auto pr-1">
            {categories.map((cid) => (
              <div
                key={cid}
                className="rounded-xl p-3 bg-white/5 dark:bg-white/5"
              >
                <div className="mb-2 font-semibold text-sm">
                  {categoryLabels[cid] || cid}
                </div>

                <div className="space-y-1">
                  {(players || []).map((p) => {
                    const pid = normalizeId(p);
                    const name = playerNameById[pid] || String(pid).slice(-5);
                    const info = (answerDetails[pid] &&
                      answerDetails[pid][cid]) || {
                      value: "",
                      valid: false,
                      unique: false,
                      points: 0,
                      reason: "empty",
                    };

                    const badgeText = info.valid
                      ? info.unique
                        ? "✔ unique"
                        : "≡ duplicate"
                      : "✖ invalid";

                    const badgeClass = info.valid
                      ? info.unique
                        ? "text-emerald-600"
                        : "text-amber-600"
                      : "text-rose-600";

                    return (
                      <div
                        key={pid}
                        className="flex items-center justify-between px-3 py-2 rounded-lg"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="truncate font-medium">{name}</div>
                          <div className="truncate text-sm opacity-80">
                            — {info.value || "—"}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs ${badgeClass}`}>
                            {badgeText}
                          </span>
                          <span className="font-mono text-sm">
                            +{info.points}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Round totals */}
          <div className="mt-4">
            <div className="mb-2 text-sm font-medium">Round totals</div>
            <div className="space-y-2">
              {roundTotals.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 bg-white/5 dark:bg-white/5"
                >
                  <div>{r.name}</div>
                  <div className="font-mono">+{r.pts}</div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
