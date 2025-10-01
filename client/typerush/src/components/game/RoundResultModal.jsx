import { useState } from "react";
import GlassCard from "@/components/global/GlassCard";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle,
  Copy,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
  const [activeIndex, setActiveIndex] = useState(0); // currently shown category

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

  const currentCategoryId = categories[activeIndex];
  const currentLabel = categoryLabels[currentCategoryId] || currentCategoryId;

  const goNext = () =>
    setActiveIndex((prev) => (prev + 1 < categories.length ? prev + 1 : prev));
  const goPrev = () =>
    setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev));

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center p-4">
      {/* Background overlay */}
      <div
        className="absolute inset-0 backdrop-blur-lg"
        onClick={onRequestClose}
      />

      {/* Main modal */}
      <GlassCard className="relative w-full max-w-3xl text-[var(--text)] p-6 flex flex-col max-h-[90vh]">
        {/* ---------- HEADER ---------- */}
        <div className="flex justify-between items-center mb-4">
          <div className="font-bold text-lg">
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
                  : `Конечни резултати за ${breakLeft}s`}
              </div>
            )}
            {isHost && (
              <Button
                onClick={onNextRound}
                size="sm"
                variant="outline"
                title="Следна рунда"
              >
                {hasMoreRounds ? "Следна рунда" : "Конечни резултати"}
              </Button>
            )}
          </div>
        </div>

        {/* ---------- CATEGORY NAVIGATION ---------- */}
        <div className="flex justify-between items-center mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={goPrev}
            disabled={activeIndex === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="font-semibold text-center text-[var(--secondary)] text-lg truncate max-w-[70%]">
            {currentLabel}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={goNext}
            disabled={activeIndex === categories.length - 1}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* ---------- RESULTS FOR CURRENT CATEGORY ---------- */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {(players || []).map((p) => {
            const pid = normalizeId(p);
            const name = playerNameById[pid] || String(pid).slice(-5);
            const info = (answerDetails[pid] &&
              answerDetails[pid][currentCategoryId]) || {
              value: "",
              valid: false,
              unique: false,
              points: 0,
              reason: "empty",
            };
            const isCurrent = String(pid) === String(currentUserId);

            // Determine badge look
            let badgeIcon, badgeText, badgeClass;
            if (info.value === "" || info.reason === "empty") {
              badgeIcon = <XCircle className="w-4 h-4 text-gray-400" />;
              badgeText = "празно";
              badgeClass = "text-gray-400";
            } else if (info.valid && info.unique) {
              badgeIcon = <CheckCircle className="w-4 h-4 text-emerald-600" />;
              badgeText = "уникатно";
              badgeClass = "text-emerald-600";
            } else if (info.valid && !info.unique) {
              badgeIcon = <Copy className="w-4 h-4 text-amber-600" />;
              badgeText = "дупликат";
              badgeClass = "text-amber-600";
            } else {
              badgeIcon = <XCircle className="w-4 h-4 text-rose-600" />;
              badgeText = "неважечко";
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
                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
                  <div
                    className={`font-medium truncate ${
                      isCurrent ? "text-[var(--secondary)]" : ""
                    }`}
                  >
                    {name}
                  </div>

                  {/* Answer below name on mobile, inline on desktop */}
                  <div
                    className="opacity-80 text-sm truncate sm:whitespace-nowrap break-words sm:break-normal"
                    title={info.value || ""}
                  >
                    {info.value ? (
                      <>
                        <span className="hidden sm:inline">— </span>
                        {info.value}
                      </>
                    ) : (
                      <span className="opacity-50">—</span>
                    )}
                  </div>
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        {badgeIcon}
                        <span className="font-mono text-sm">
                          +{info.points}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{badgeText}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            );
          })}
        </div>

        {/* ---------- REVIEW WORDS ---------- */}
        {reviewsByCat[currentCategoryId] &&
          reviewsByCat[currentCategoryId].length > 0 && (
            <div className="mt-3 p-2 border-t border-[var(--text)]/20">
              <div className="mb-1 font-semibold text-xs">
                Предложени зборови за додавање:
              </div>

              {reviewsByCat[currentCategoryId].map((rw) => {
                const myVote = rw.votes?.find(
                  (v) => String(v.player) === String(currentUserId)
                );
                const isOwnWord =
                  String(rw.submittedBy) === String(currentUserId);

                let statusIcon = null;
                if (rw.status === "accepted") {
                  statusIcon = (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  );
                } else if (rw.status === "rejected") {
                  statusIcon = <XCircle className="w-4 h-4 text-rose-600" />;
                }

                return (
                  <div
                    key={rw._id}
                    className="flex flex-col gap-1 bg-[var(--background)]/40 px-2 py-1 rounded-md"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span>{rw.word}</span>
                      <span className="opacity-70 text-xs">
                        (од {playerNameById[rw.submittedBy] || "играч"})
                      </span>
                      {statusIcon}
                    </div>

                    {rw.status === "pending" && !isOwnWord && (
                      <div className="flex gap-2">
                        <Button
                          size="xs"
                          variant={
                            myVote?.valid === true ? "default" : "outline"
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
                            myVote?.valid === false ? "default" : "outline"
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
      </GlassCard>
    </div>
  );
}
