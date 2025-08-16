// src/pages/GamePage.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import GlassCard from "@/components/GlassCard";
import PlayersList from "@/components/PlayersList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GamePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id;

  // players + host
  const [players, setPlayers] = useState([]); // can be array of ids or populated users
  const [playerNameById, setPlayerNameById] = useState({});
  const [hostId, setHostId] = useState(null);

  // round state
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [letter, setLetter] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryLabels, setCategoryLabels] = useState({}); // id -> MK/EN name
  const [endAt, setEndAt] = useState(null);

  // answers / timer
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // results modal
  const [showResults, setShowResults] = useState(false);
  const [roundScores, setRoundScores] = useState({});
  const [roundAnswers, setRoundAnswers] = useState({});
  const [answerDetails, setAnswerDetails] = useState({}); // per-answer info
  const [breakEndAt, setBreakEndAt] = useState(null);
  const [breakLeft, setBreakLeft] = useState(0);

  // final results modal
  const [showFinal, setShowFinal] = useState(false);
  const [finalTotals, setFinalTotals] = useState({});
  const [finalWinners, setFinalWinners] = useState([]);

  // server clock offset (prevents "insta-end" if client clock is ahead)
  const [serverOffsetMs, setServerOffsetMs] = useState(0);

  // refs to avoid stale submissions & track membership
  const answersRef = useRef({});
  const endAtRef = useRef(null);
  const joinedRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    endAtRef.current = endAt;
  }, [endAt]);

  const normalizeId = (v) =>
    typeof v === "string" ? v : v?._id ?? String(v ?? "");
  const isHost = Boolean(
    hostId && currentUserId && String(hostId) === String(currentUserId)
  );

  const fetchRoom = useCallback(async () => {
    try {
      const res = await api.get(`/room/${code}`);
      const room = res.data.room || {};
      const map = {};
      (room.players || []).forEach((p) => {
        const id = normalizeId(p);
        const name = p.username || id.slice(-5);
        map[id] = name;
      });
      setPlayers(room.players || []);
      setPlayerNameById(map);
      setHostId(normalizeId(room.host));
    } catch {
      // noop
    }
  }, [code]);

  // join only when socket is connected and user is known
  useEffect(() => {
    if (!code || !currentUserId) return;

    const tryJoin = () => {
      if (socket.connected && !joinedRef.current) {
        socket.emit("joinRoom", { code, userId: currentUserId });
        joinedRef.current = true;
      }
    };

    fetchRoom().finally(tryJoin);
    socket.on("connect", tryJoin);

    return () => {
      socket.off("connect", tryJoin);
    };
  }, [code, currentUserId, fetchRoom]);

  // leave on unmount
  useEffect(() => {
    return () => {
      if (joinedRef.current) {
        socket.emit("leaveRoom", { code });
        joinedRef.current = false;
      }
    };
  }, [code]);

  // round countdown (uses server offset if provided)
  useEffect(() => {
    const t = setInterval(() => {
      if (!endAt) return;
      const ms = new Date(endAt).getTime() - (Date.now() + serverOffsetMs);
      setTimeLeft(ms > 0 ? Math.ceil(ms / 1000) : 0);
    }, 250);
    return () => clearInterval(t);
  }, [endAt, serverOffsetMs]);

  // break countdown
  useEffect(() => {
    const t = setInterval(() => {
      if (!breakEndAt) return;
      const ms = new Date(breakEndAt).getTime() - Date.now();
      setBreakLeft(ms > 0 ? Math.ceil(ms / 1000) : 0);
    }, 250);
    return () => clearInterval(t);
  }, [breakEndAt]);

  // auto-submit when time ends (uses ref to avoid stale answers)
  useEffect(() => {
    if (timeLeft === 0 && endAt && !submitted) {
      socket.emit("submitAnswers", { answers: answersRef.current });
      setSubmitted(true);
    }
  }, [timeLeft, endAt, submitted]);

  // best-effort submit on tab close
  useEffect(() => {
    const onBeforeUnload = () => {
      if (!submitted && endAtRef.current) {
        socket.emit("submitAnswers", { answers: answersRef.current });
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [submitted]);

  // handlers (top-level; used by modals)
  const handleLeaveRoom = () => {
    socket.emit("leaveRoom", { code });
    navigate("/");
  };
  const handlePlayAgain = () => {
    if (isHost) {
      socket.emit("startGame"); // reuse same room settings
      setShowFinal(false);
    }
  };
  const handleStayHere = () => setShowFinal(false);
  const handleChange = (key, val) =>
    setAnswers((prev) => ({ ...prev, [key]: val }));
  const handleSubmit = () => {
    if (submitted) return;
    socket.emit("submitAnswers", { answers: answersRef.current });
    setSubmitted(true);
  };
  const handleNextRound = () => {
    if (isHost) socket.emit("nextRound");
  };

  // socket listeners
  useEffect(() => {
    const onRoundStarted = ({
      currentRound,
      totalRounds,
      letter,
      categories,
      categoryMeta,
      roundEndTime,
      serverNow, // optional from server for skew correction
    }) => {
      setCurrentRound(currentRound);
      setTotalRounds(totalRounds);
      setLetter(letter);
      setCategories((categories || []).map(String));
      setCategoryLabels(
        (categoryMeta || []).reduce((acc, { id, name }) => {
          acc[String(id)] = name;
          return acc;
        }, {})
      );
      setEndAt(roundEndTime);
      setServerOffsetMs(
        typeof serverNow === "number" ? serverNow - Date.now() : 0
      );

      setAnswers({});
      setSubmitted(false);
      setShowResults(false);
      setAnswerDetails({});
      setBreakEndAt(null);
      setShowFinal(false);
    };

    const onRoundResults = ({ scores, answers, details, breakEndTime }) => {
      setRoundScores(scores || {});
      setRoundAnswers(answers || {});
      setAnswerDetails(details || {});
      setBreakEndAt(breakEndTime || null);
      setShowResults(true);
    };

    const onGameEnded = (payload) => {
      setShowResults(false);
      setBreakEndAt(null);
      if (payload && payload.totals) {
        setFinalTotals(payload.totals || {});
        setFinalWinners(payload.winners || []);
      } else {
        setFinalTotals({});
        setFinalWinners([]);
      }
      setShowFinal(true);
    };

    const onPlayersUpdated = ({ players: list }) => {
      setPlayers(list || []);
      // keep existing names; they’ll refresh via roomUpdated or lobby fetch
    };

    const onRoomUpdated = ({ room }) => {
      if (!room) return;
      setHostId(normalizeId(room.host));
      if (Array.isArray(room.players) && room.players.length) {
        const map = {};
        room.players.forEach((p) => {
          const id = normalizeId(p);
          const name = p.username || id.slice(-5);
          map[id] = name;
        });
        setPlayers(room.players);
        setPlayerNameById((prev) => ({ ...prev, ...map }));
      }
    };

    socket.on("roundStarted", onRoundStarted);
    socket.on("roundResults", onRoundResults);
    socket.on("gameEnded", onGameEnded);
    socket.on("playersUpdated", onPlayersUpdated);
    socket.on("roomUpdated", onRoomUpdated);

    return () => {
      socket.off("roundStarted", onRoundStarted);
      socket.off("roundResults", onRoundResults);
      socket.off("gameEnded", onGameEnded);
      socket.off("playersUpdated", onPlayersUpdated);
      socket.off("roomUpdated", onRoomUpdated);
    };
  }, []);

  const sortedRoundResults = useMemo(() => {
    const arr = Object.entries(roundScores).map(([id, pts]) => ({
      id,
      pts,
      name: playerNameById[id] || id.slice(-5),
    }));
    arr.sort((a, b) => b.pts - a.pts);
    return arr;
  }, [roundScores, playerNameById]);

  const waitingForRound = !letter || !categories?.length || !endAt;
  const CategoryLabel = ({ id }) => <span>{categoryLabels[id] || id}</span>;

  // Round Results Modal
  const ResultsModal = () =>
    !showResults ? null : (
      <div className="fixed inset-0 z-40">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-3xl p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <div className="font-bold text-lg">
                Round {currentRound} Results
              </div>
              <div className="flex items-center gap-3">
                {breakEndAt && (
                  <div className="opacity-70 text-sm">
                    Next round in {breakLeft}s
                  </div>
                )}
                {isHost && currentRound < totalRounds && (
                  <Button size="sm" onClick={handleNextRound}>
                    Next round
                  </Button>
                )}
              </div>
            </div>

            {/* Per-category answers */}
            <div className="gap-4 grid max-h-[55vh] overflow-auto pr-1">
              {categories.map((cid) => (
                <div key={cid} className="p-3 border rounded-xl">
                  <div className="mb-2 font-semibold text-sm">
                    {categoryLabels[cid] || cid}
                  </div>
                  <div className="space-y-1">
                    {(players || []).map((p) => {
                      const pid = normalizeId(p);
                      const name = playerNameById[pid] || String(pid).slice(-5);
                      const info = (answerDetails[pid] || {})[cid] || {
                        value: "",
                        valid: false,
                        unique: false,
                        points: 0,
                        reason: "empty",
                      };
                      const badge = info.valid
                        ? info.unique
                          ? "✔ unique"
                          : "≡ duplicate"
                        : "✖ invalid";
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
                            <span
                              className={`text-xs ${
                                info.valid
                                  ? info.unique
                                    ? "text-emerald-600"
                                    : "text-amber-600"
                                  : "text-rose-600"
                              }`}
                            >
                              {badge}
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
              <div className="mb-2 font-medium text-sm">Round totals</div>
              <div className="space-y-2">
                {sortedRoundResults.map((r) => (
                  <div
                    key={r.id}
                    className="flex justify-between items-center px-3 py-2 border rounded-lg"
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

  // Final Results Modal
  const FinalResultsModal = () =>
    !showFinal ? null : (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-3xl p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <div className="font-bold text-xl">Game Over</div>
              <div className="text-sm opacity-70">Room {code}</div>
            </div>

            {/* Winner(s) */}
            <div className="mb-4">
              {finalWinners.length > 0 ? (
                <div className="text-lg">
                  Winner{finalWinners.length > 1 ? "s" : ""}:{" "}
                  <span className="font-semibold">
                    {finalWinners
                      .map((id) => playerNameById[id] || String(id).slice(-5))
                      .join(", ")}
                  </span>
                </div>
              ) : (
                <div className="text-lg">No winner</div>
              )}
            </div>

            {/* Leaderboard */}
            <div className="mb-2 font-medium text-sm">Final scores</div>
            <div className="space-y-2 max-h-[55vh] overflow-auto pr-1">
              {Object.entries(finalTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([pid, pts]) => {
                  const isWinner = finalWinners.includes(pid);
                  return (
                    <div
                      key={pid}
                      className={`flex justify-between items-center px-3 py-2 border rounded-lg ${
                        isWinner
                          ? "bg-emerald-50/50 dark:bg-emerald-900/20"
                          : ""
                      }`}
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
            <div className="flex flex-wrap justify-end items-center gap-2 mt-6">
              <Button variant="ghost" onClick={handleStayHere}>
                Stay here
              </Button>
              <Button variant="outline" onClick={handleLeaveRoom}>
                Leave to Home
              </Button>
              {isHost && (
                <Button onClick={handlePlayAgain}>Start New Game</Button>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    );

  return (
    <div className="mx-auto py-6 w-[90vw] max-w-[1400px] min-h-[80vh] text-[var(--text)]">
      <div className="gap-4 grid grid-cols-1 lg:grid-cols-4">
        {/* LEFT 3/4: MAIN + PLAYERS */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          {/* MAIN */}
          <GlassCard className="relative order-1 lg:order-2 p-6 overflow-hidden">
            {/* Round / Timer */}
            <div className="flex justify-between items-center mb-3">
              <div className="font-medium text-sm">
                Round {currentRound || "-"} / {totalRounds || "-"}
              </div>
              <div className="font-mono tabular-nums text-lg">
                {endAt ? `${timeLeft}s` : "--"}
              </div>
            </div>

            {/* Big letter */}
            <div className="mb-6 text-center">
              <div className="opacity-70 text-xs">Letter</div>
              <div className="font-extrabold text-7xl tracking-widest">
                {letter ?? "-"}
              </div>
            </div>

            {/* Inputs */}
            <div className="gap-4 grid">
              {waitingForRound ? (
                <div className="py-12 text-center">
                  Waiting for the round to start…
                </div>
              ) : (
                categories.map((key) => (
                  <div
                    key={key}
                    className="items-center gap-3 grid grid-cols-12"
                  >
                    <div className="col-span-12 lg:col-span-4 font-medium text-sm truncate">
                      <CategoryLabel id={key} />
                    </div>
                    <div className="col-span-12 lg:col-span-8">
                      <Input
                        placeholder={`Starts with ${letter}`}
                        value={answers[key] || ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        disabled={submitted || timeLeft === 0}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Submit */}
            {!waitingForRound && (
              <div className="flex justify-end items-center gap-3 mt-6">
                <div className="opacity-70 text-sm">
                  {submitted
                    ? "Submitted. You can’t edit now."
                    : "You can edit until time runs out."}
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={submitted || timeLeft === 0}
                >
                  {submitted ? "Submitted" : "Submit"}
                </Button>
              </div>
            )}
          </GlassCard>

          {/* PLAYERS */}
          <div className="order-2 lg:order-1">
            <PlayersList players={players} className="w-full" />
          </div>
        </div>

        {/* RIGHT 1/4 placeholder */}
        <GlassCard className="lg:col-span-1 p-0 overflow-hidden">
          <div className="flex justify-center items-center p-6 h-full min-h-[300px]">
            <div className="flex justify-center items-center border rounded-2xl w-full h-[340px]">
              <span className="opacity-80">Placeholder Image</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Modals */}
      <ResultsModal />
      <FinalResultsModal />
    </div>
  );
}
