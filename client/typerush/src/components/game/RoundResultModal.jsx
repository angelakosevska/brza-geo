import GlassCard from "@/components/global/GlassCard";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, XCircle } from "lucide-react"; // 👈 import icons

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

                    const info = (answerDetails[pid] &&
                      answerDetails[pid][cid]) || {
                      value: "",
                      valid: false,
                      unique: false,
                      points: 0,
                      reason: "празно",
                    };

                    const isCurrent = String(pid) === String(currentUserId);

                    // Decide icon + text + color
                    let badgeIcon, badgeText, badgeClass;
                    if (info.value === "" || info.reason === "празно") {
                      badgeIcon = <XCircle className="w-4 h-4 text-gray-400" />;
                      badgeText = "празно";
                      badgeClass = "text-gray-400";
                    } else if (info.valid && info.unique) {
                      badgeIcon = (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      );
                      badgeText = "уникатно";
                      badgeClass = "text-emerald-600";
                    } else if (info.valid && !info.unique) {
                      badgeIcon = <Copy className="w-4 h-4 text-amber-600" />;
                      badgeText = "дупликат";
                      badgeClass = "text-amber-600";
                    } else {
                      badgeIcon = <XCircle className="w-4 h-4 text-rose-600" />;
                      badgeText = "невалидно";
                      badgeClass = "text-rose-600";
                    }

                    return (
                      <div
                        key={pid}
                        className={`flex justify-between items-center px-3 py-2 rounded-lg transition
                          ${
                            isCurrent
                              ? "bg-[var(--secondary)]/20"
                              : "bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10"
                          }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`font-medium truncate ${
                              isCurrent ? "text-[var(--secondary)]" : ""
                            }`}
                          >
                            {name}
                          </div>
                          <div className="opacity-80 text-sm truncate">
                            — {info.value || "—"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {badgeIcon}
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
