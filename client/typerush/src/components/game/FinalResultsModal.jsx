import { useEffect, useMemo } from "react";
import GlassCard from "@/components/global/GlassCard";
import { Button } from "@/components/ui/button";
import { Award, Medal, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function FinalResultsModal({
  show = false,
  code,
  playerNameById = {},
  finalTotals = {},
  finalWinners = [],
  isHost = false,
  onBackToRoom,
  onLeaveToMain,
  onStartNewGame,
  onRequestClose,
  closeOnOverlay = true,
  currentUserId,
}) {
  if (!show) return null;

  const dummyPlayers = [
    { id: "demo1", name: "Bot Alpha", points: 42 },
    { id: "demo2", name: "Bot Beta", points: 37 },
    { id: "demo3", name: "Bot Gamma", points: 25 },
  ];

  const sorted = useMemo(() => {
    const entries = Object.entries(finalTotals);
    return entries.sort((a, b) => {
      const [ida, pa] = a;
      const [idb, pb] = b;

      if (pb !== pa) return pb - pa;
      const na = (playerNameById[ida] || String(ida).slice(-5)).toLowerCase();
      const nb = (playerNameById[idb] || String(idb).slice(-5)).toLowerCase();
      if (na !== nb) return na < nb ? -1 : 1;
      return String(ida) < String(idb) ? -1 : 1;
    });
  }, [finalTotals, playerNameById]);

  // горе во компонентата, после sorted
  const myPoints = finalTotals[currentUserId] || 0;
  const myWpEarned = Math.floor(myPoints / 2);

  const winnerNames =
    finalWinners.length > 0
      ? finalWinners
          .map((id) => playerNameById[id] || String(id).slice(-5))
          .join(", ")
      : null;

  const handleOverlayClick = () => {
    if (closeOnOverlay) onRequestClose?.();
  };

  useEffect(() => {
    if (!show) return;
    const onKey = (e) => {
      if (e.key === "Escape") onRequestClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, onRequestClose]);

  // Styling for top 3 places
  const styleForPlace = (place) => {
    if (place === 1)
      return {
        icon: <Trophy className="w-5 h-5 text-yellow-500" />,
        className:
          "border-yellow-500 bg-yellow-500/10 text-[var(--text)] font-semibold broder-2",
      };
    if (place === 2)
      return {
        icon: <Medal className="w-5 h-5 text-gray-500" />,
        className:
          "border-gray-500 bg-gray-100/10 text-[var(--text)]font-semibold",
      };
    if (place === 3)
      return {
        icon: <Award className="w-5 h-5 text-amber-600" />,
        className:
          "border-amber-600 bg-amber-600/10 text-[var(--text)] font-semibold",
      };
    return { icon: null, className: "" };
  };

  const placeByRow = useMemo(() => {
    const places = [];
    let currentPlace = 1;
    let prevPts = null;

    for (let i = 0; i < sorted.length; i++) {
      const pts = sorted[i][1];
      if (prevPts === null) {
        places.push(currentPlace);
        prevPts = pts;
      } else if (pts === prevPts) {
        places.push(currentPlace);
      } else {
        currentPlace = i + 1;
        places.push(currentPlace);
        prevPts = pts;
      }
    }
    return places;
  }, [sorted]);

  return (
    <div
      className="z-50 fixed inset-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="final-results-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 backdrop-blur-lg"
        onClick={handleOverlayClick}
      />

      {/* Modal card */}
      <div className="absolute inset-0 flex justify-center items-center p-4">
        {/* <GlassCard className="relative p-6 w-full max-w-3xl text-[var(--text)]"> */}
        <GlassCard
          className={`relative p-6 w-full lg:max-w-[60vw] sm:max-w-[90vw] max-h-[90vh] text-[var(--text)] overflow-y-auto ${
            finalWinners.includes(currentUserId) ? "winner-border" : ""
          }`}
        >
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pr-8">
            <div id="final-results-title" className="font-bold text-xl">
              Играта заврши
            </div>
            {code && (
              <div className="flex items-center gap-2 opacity-70 text-xs">
                <span>Код на соба: </span>
                <span className="text-[var(--secondary)]">{code}</span>
              </div>
            )}
          </div>

          {/* Winners */}
          {finalWinners.includes(currentUserId) ? (
            <div className="flex flex-col items-center">
              <Trophy className="mb-2 w-12 h-12 text-yellow-500" />
              <div className="font-bold text-[var(--text)] text-2xl">
                Честитки{" "}
                <span className="text-[var(--secondary)]">
                  {playerNameById[currentUserId] || "Ти"}!
                </span>
              </div>
              <div className="opacity-80 text-lg">Ти си победник! 🏆</div>
            </div>
          ) : winnerNames ? (
            <div className="flex flex-col items-center">
              <Trophy className="mb-2 w-12 h-12 text-yellow-500" />
              <div className="text-lg">
                Победни{finalWinners.length > 1 ? "ци" : "к"}:{" "}
                <span className="font-semibold text-[var(--secondary)]">
                  {winnerNames}
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-6 text-lg text-center">Нема победници</div>
          )}

          {/* Final table */}
          <div className="space-y-2 pr-1 max-h-[60vh] overflow-auto">
            {sorted.map(([pid, pts], idx) => {
              const place = placeByRow[idx];
              const name = playerNameById[pid] || String(pid).slice(-5);
              const isCurrent = String(pid) === String(currentUserId);

              const { icon, className } = styleForPlace(place);

              return (
                <div
                  key={pid}
                  className={`flex items-center justify-between rounded-xl px-5 py-3 border transition
                    ${
                      isCurrent
                        ? " " + className
                        : className ||
                          "bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 border border-[var(--text)]/10"
                    }
                  `}
                >
                  {/* Name + place */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="opacity-90 w-6 font-mono text-[var(--text)] text-right">
                      {place}.
                    </span>
                    <span className="w-6">{icon}</span>
                    <div className="truncate">{name}</div>
                  </div>

                  {/* Points */}
                  <div>
                    <span className="bg-[var(--text)]/20 px-3 py-1 rounded-full font-mono">
                      {pts}
                    </span>{" "}
                    поени
                  </div>
                </div>
              );
            })}
          </div>

          {/* Word Power XP */}

          {myWpEarned > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="mt-6 font-bold text-lg text-center"
            >
              Добивте{" "}
              <span className="bg-[var(--primary)]/20 px-3 py-2 rounded-full text-[var(--secondary)]">
                +{myWpEarned}
              </span>{" "}
              Word Power!
            </motion.div>
          )}
          {/* Actions */}

          <div className="flex flex-wrap justify-end items-center gap-2 mt-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" onClick={onLeaveToMain}>
                    Излези во Мени
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Напушти ја играта и врати се во главното мени</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={onBackToRoom}>
                    Назад во Соба
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Врати се во собата и чекај домаќинот да започне нова игра (со новии опции)</p>
                </TooltipContent>
              </Tooltip>

              {isHost && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={onStartNewGame}>Нова Игра</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Започни нова партија со истите играчи и опции</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}