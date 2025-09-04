import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";

export default function RoundResultsModal({
  show = false,
  isHost = false,
  currentRound = 1,
  totalRounds = 1,

  categories = [],
  categoryLabels = {},
  players = [],
  playerNameById = {},
  answerDetails = {},
  roundScores = {},

  breakLeft = null,

  onNextRound,
  onRequestClose,
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
      className="z-50 fixed inset-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="round-results-title"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onRequestClose}
      />
      <div className="absolute inset-0 flex justify-center items-center p-4">
        <GlassCard className="relative p-6 w-full max-w-3xl text-[var(--text)]">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div id="round-results-title" className="font-bold text-lg">
              <span className="text-[var(--secondary)] text-3xl">{currentRound} </span>рунда
            </div>
            <div className="flex items-center gap-3">
              {breakLeft != null && (
                <div className="opacity-70 text-sm">
                  Следна рунда за {breakLeft}s
                </div>
              )}
              {isHost && currentRound < totalRounds && (
                <Button onClick={onNextRound} size="sm" title="Следна рунда">
                  Започни следна рунда
                </Button>
              )}
            </div>
          </div>

          {/* Per-category answers */}
          <div className="gap-4 grid pr-1 max-h-[55vh] overflow-auto">
            {categories.map((cid) => (
              <div
                key={cid}
                className="bg-[var(--primary)]/5 p-3 border border-[var(--text)]/5 rounded-2xl"
              >
                <div className="mb-2 font-semibold text-sm">
                  {categoryLabels[cid] || cid}
                </div>

                <div className="space-y-1">
                  {(players || []).map((p) => {
                    const pid = normalizeId(p);
                    const name = playerNameById[pid] || String(pid).slice(-5);
                    const info =
                      (answerDetails[pid] && answerDetails[pid][cid]) || {
                        value: "",
                        valid: false,
                        unique: false,
                        points: 0,
                        reason: "empty",
                      };

                    const badgeText = info.valid
                      ? info.unique
                        ? "✔ уникатно"
                        : "≡ дупликат"
                      : "✖ невалидно";

                    const badgeClass = info.valid
                      ? info.unique
                        ? "text-emerald-600"
                        : "text-amber-600"
                      : "text-rose-600";

                    return (
                      <div
                        key={pid}
                        className="flex justify-between items-center px-3 py-2 rounded-lg"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="font-medium truncate">{name}</div>
                          <div className="opacity-80 text-sm truncate">
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
            <div className="mb-2 font-medium text-sm">Вкупно резултати</div>
            <div className="space-y-2">
              {roundTotals.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between items-center bg-[var(--primary)]/5 px-3 py-2 border border-[var(--text)]/5 rounded-lg"
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
