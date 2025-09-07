import { useEffect, useMemo, useCallback } from "react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";

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
}) {
  if (!show) return null;

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

  const medalForIndex = (idx) => {
    if (idx === 0) return "🥇";
    if (idx === 1) return "🥈";
    if (idx === 2) return "🥉";
    return null;
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
      <div
        className="absolute inset-0 backdrop-blur-lg"
        onClick={handleOverlayClick}
      />
      <div className="absolute inset-0 flex justify-center items-center p-4">
        <GlassCard className="relative p-6 w-full max-w-3xl text-[var(--text)]">
          <button
            onClick={onRequestClose}
            aria-label="Затвори"
            className="top-3 right-3 absolute opacity-70 hover:opacity-100 px-2 py-1 rounded-full focus:outline-none focus:ring-[var(--accent)] focus:ring-2 text-sm"
          >
            ✕
          </button>

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

          {/* Final scores */}

          <div className="space-y-2 pr-1 max-h-[55vh] overflow-auto">
            {sorted.map(([pid, pts], idx) => {
              const isWinner = finalWinners.includes(pid);
              const name = playerNameById[pid] || String(pid).slice(-5);
              const place = placeByRow[idx];
              const medal = medalForIndex(idx);

              return (
                <div
                  key={pid}
                  className={`flex items-center justify-between rounded-2xl px-5 py-3
    bg-[var(--primary)]/5 border 
    ${isWinner ? "border-[var(--accent)]" : "border-[var(--text)]/5"}
  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="opacity-80 w-6 font-mono text-right">
                      {place}.
                    </span>
                    <span className="w-6">{medal ?? ""}</span>
                    <div className="font-medium truncate">{name}</div>
                  </div>
                  <div className="font-mono">#{pts}</div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-end items-center gap-2 mt-6">
            <Button
              variant="ghost"
              onClick={onLeaveToMain}
              title="Излези во мени"
            >
              Излези
            </Button>
            <Button
              variant="outline"
              onClick={onBackToRoom}
              title="Назад во собата, промена на опции"
            >
              Назад
            </Button>
            {isHost && (
              <Button
                onClick={onStartNewGame}
                title="Започни нова игра со истите опции"
              >
                Започни нова игра
              </Button>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
