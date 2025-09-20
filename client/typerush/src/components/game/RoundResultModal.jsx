import GlassCard from "@/components/global/GlassCard";
import { Button } from "@/components/ui/button";

export default function RoundResultsModal({
  show = false,
  isHost = false,
  currentRound = 1,
  categories = [],
  categoryLabels = {},
  players = [],
  playerNameById = {},
  answerDetails = {},

  breakLeft = null,
  hasMoreRounds,
  onNextRound,
  onRequestClose,

  currentUserId, // ID на најавениот корисник
}) {
  if (!show) return null;

  const normalizeId = (p) =>
    typeof p === "string" ? p : p?._id ?? String(p ?? "");

  return (
    <div
      className="z-50 fixed inset-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="round-results-title"
    >
      <div
        className="absolute inset-0 backdrop-blur-lg"
        onClick={onRequestClose}
      />
      <div className="absolute inset-0 flex justify-center items-center p-4">
        <GlassCard className="relative p-6 w-full max-w-3xl text-[var(--text)]">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div id="round-results-title" className="font-bold text-lg">
              <span className="text-[var(--secondary)] text-3xl">
                {currentRound}{" "}
              </span>
              рунда
            </div>
            <div className="flex items-center gap-3">
              {breakLeft != null && (
                <div className="opacity-70 text-sm">
                  {hasMoreRounds
                    ? `Следна рунда за ${breakLeft}s`
                    : `Финални резултати за ${breakLeft}s`}
                </div>
              )}
              {isHost && (
                <>
                  {hasMoreRounds ? (
                    <Button
                      onClick={onNextRound}
                      size="sm"
                      variant="outline"
                      title="Следна рунда"
                    >
                      Започни следна рунда
                    </Button>
                  ) : (
                    <Button
                      onClick={onNextRound}
                      size="sm"
                      variant="outline"
                      title="Прескокни чекање"
                    >
                      Прескокни чекање
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Per-category answers */}
          <div className="gap-4 grid pr-1 max-h-[55vh] overflow-auto">
            {categories.map((cid) => (
              <div
                key={cid}
                className="bg-[var(--primary)]/10 p-3 border border-[var(--text)]/10 rounded-2xl"
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
                        reason: "празно",
                      };

                    const isCurrent =
                      String(pid) === String(currentUserId);

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
                        className={`flex justify-between items-center px-3 py-2 rounded-lg transition
                          ${
                            isCurrent
                              ? "bg-[var(--accent)]/20"
                              : "bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10"
                          }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`font-medium truncate ${
                              isCurrent ? "text-[var(--accent)]" : ""
                            }`}
                          >
                            {name}
                          </div>
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
        </GlassCard>
      </div>
    </div>
  );
}
