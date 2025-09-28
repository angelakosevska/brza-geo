import GlassCard from "@/components/global/GlassCard";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, XCircle, ThumbsUp, ThumbsDown } from "lucide-react";

export default function RoundResultsModal({
  show = false,
  isHost = false,
  currentRound = 1,
  categories = [],
  categoryLabels = {},
  players = [],
  playerNameById = {},
  answerDetails = {},

  reviewWords = [],
  currentUserId,

  breakLeft = null,
  hasMoreRounds,
  onNextRound,
  onRequestClose,
  onVoteReview,
}) {
  if (!show) return null;

  const normalizeId = (p) =>
    typeof p === "string" ? p : p?._id ?? String(p ?? "");

  // Group review words by category (normalize ObjectId → string)
  const reviewsByCat = {};
  (reviewWords || []).forEach((rw) => {
    const catId = String(rw.category);
    if (!reviewsByCat[catId]) reviewsByCat[catId] = [];
    reviewsByCat[catId].push(rw);
  });
  const myVote = rw.votes?.find(
    (v) => String(v.player) === String(currentUserId)
  );

  return (
    <div className="z-50 fixed inset-0" role="dialog" aria-modal="true">
      {/* Background overlay */}
      <div
        className="absolute inset-0 backdrop-blur-lg"
        onClick={onRequestClose}
      />

      {/* Centered modal */}
      <div className="absolute inset-0 flex justify-center items-center p-4">
        <GlassCard className="relative p-6 w-full max-w-3xl text-[var(--text)]">
          {/* ---------- HEADER ---------- */}
          <div className="flex justify-between items-center mb-4">
            <div id="round-results-title" className="font-bold text-lg">
              <span className="text-[var(--secondary)] text-3xl">
                {currentRound}{" "}
              </span>
              round
            </div>
            <div className="flex items-center gap-3">
              {breakLeft != null && (
                <div className="opacity-70 text-sm">
                  {hasMoreRounds
                    ? `Next round in ${breakLeft}s`
                    : `Final results in ${breakLeft}s`}
                </div>
              )}
              {isHost && (
                <Button
                  onClick={onNextRound}
                  size="sm"
                  variant="outline"
                  title="Next round"
                >
                  {hasMoreRounds ? "Start next round" : "Skip waiting"}
                </Button>
              )}
            </div>
          </div>

          {/* ---------- PER-CATEGORY ANSWERS ---------- */}
          <div className="gap-4 grid pr-1 max-h-[55vh] overflow-auto">
            {categories.map((cid) => (
              <div
                key={cid}
                className="bg-[var(--primary)]/10 p-3 border border-[var(--text)]/10 rounded-2xl"
              >
                <div className="mb-2 font-semibold text-sm">
                  {categoryLabels[cid] || cid}
                </div>

                {/* Player answers for this category */}
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

                    const isCurrent = String(pid) === String(currentUserId);

                    // Badge depending on answer validity
                    let badgeIcon, badgeText, badgeClass;
                    if (info.value === "" || info.reason === "empty") {
                      badgeIcon = <XCircle className="w-4 h-4 text-gray-400" />;
                      badgeText = "empty";
                      badgeClass = "text-gray-400";
                    } else if (info.valid && info.unique) {
                      badgeIcon = (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      );
                      badgeText = "unique";
                      badgeClass = "text-emerald-600";
                    } else if (info.valid && !info.unique) {
                      badgeIcon = <Copy className="w-4 h-4 text-amber-600" />;
                      badgeText = "duplicate";
                      badgeClass = "text-amber-600";
                    } else {
                      badgeIcon = <XCircle className="w-4 h-4 text-rose-600" />;
                      badgeText = "invalid";
                      badgeClass = "text-rose-600";
                    }

                    return (
                      <div
                        key={pid}
                        className={`flex justify-between items-center px-3 py-2 rounded-lg transition ${
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

                {/* ---------- REVIEW WORDS SECTION ---------- */}
                {reviewsByCat[String(cid)] &&
                  reviewsByCat[String(cid)].length > 0 && (
                    <div className="mt-3 p-2 border-[var(--text)]/20 border-t">
                      <div className="mb-1 font-semibold text-xs">
                        Предложени зборови за додавање во категоријата:
                      </div>
                      {reviewsByCat[String(cid)].map((rw) => {
                        let statusIcon = null;
                        if (rw.status === "accepted") {
                          statusIcon = (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          );
                        } else if (rw.status === "rejected") {
                          statusIcon = (
                            <XCircle className="w-4 h-4 text-rose-600" />
                          );
                        }

                        return (
                          <div
                            key={rw._id}
                            className="flex flex-col justify-between items-center gap-1 bg-[var(--background)]/40 px-2 py-1 rounded-md"
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <span>{rw.word}</span>
                              <span className="opacity-70 text-xs">
                                (by {playerNameById[rw.submittedBy] || "player"}
                                )
                              </span>
                              {statusIcon}
                            </div>

                            {/* If still pending → show vote buttons */}
                            {rw.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  size="xs"
                                  variant={
                                    myVote?.valid === true
                                      ? "default"
                                      : "outline"
                                  }
                                  disabled={!!myVote}
                                  className={
                                    myVote?.valid === true
                                      ? "bg-green-500 text-white"
                                      : "hover:bg-green-500 hover:text-white"
                                  }
                                  onClick={() => onVoteReview?.(rw._id, true)}
                                >
                                  <ThumbsUp className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="xs"
                                  variant={
                                    myVote?.valid === false
                                      ? "default"
                                      : "outline"
                                  }
                                  disabled={!!myVote}
                                  className={
                                    myVote?.valid === false
                                      ? "bg-red-500 text-white"
                                      : "hover:bg-red-500 hover:text-white"
                                  }
                                  onClick={() => onVoteReview?.(rw._id, false)}
                                >
                                  <ThumbsDown className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
