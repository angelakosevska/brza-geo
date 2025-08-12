// src/pages/GamePage.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
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
  const [players, setPlayers] = useState([]);
  const [playerNameById, setPlayerNameById] = useState({});
  const [hostId, setHostId] = useState(null);

  // round state
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [letter, setLetter] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryLabels, setCategoryLabels] = useState({}); // id -> MK name
  const [endAt, setEndAt] = useState(null);

  // answers / timer
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // results overlay
  const [showResults, setShowResults] = useState(false);
  const [roundScores, setRoundScores] = useState({});
  const [roundAnswers, setRoundAnswers] = useState({});
  const [answerDetails, setAnswerDetails] = useState({}); // per-answer info
  const [breakEndAt, setBreakEndAt] = useState(null);
  const [breakLeft, setBreakLeft] = useState(0);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await api.get(`/room/${code}`);
      const room = res.data.room;
      const map = {};
      (room.players || []).forEach((p) => {
        const id = p._id || p;
        const name = p.username || String(id).slice(-5);
        map[id] = name;
      });
      setPlayers(room.players || []);
      setPlayerNameById(map);
      setHostId(room.host?._id || room.host || null);
    } catch {}
  }, [code]);

  const isHost = !!hostId && hostId === currentUserId;

  // round countdown
  useEffect(() => {
    const t = setInterval(() => {
      if (!endAt) return;
      const ms = new Date(endAt).getTime() - Date.now();
      setTimeLeft(ms > 0 ? Math.ceil(ms / 1000) : 0);
    }, 250);
    return () => clearInterval(t);
  }, [endAt]);

  // break countdown
  useEffect(() => {
    const t = setInterval(() => {
      if (!breakEndAt) return;
      const ms = new Date(breakEndAt).getTime() - Date.now();
      setBreakLeft(ms > 0 ? Math.ceil(ms / 1000) : 0);
    }, 250);
    return () => clearInterval(t);
  }, [breakEndAt]);

  useEffect(() => {
    fetchRoom();
    if (code && currentUserId)
      socket.emit("joinRoom", { code, userId: currentUserId });
  }, [code, currentUserId, fetchRoom]);

  useEffect(() => {
    const onRoundStarted = ({
      currentRound,
      totalRounds,
      letter,
      categories,
      categoryMeta,
      roundEndTime,
    }) => {
      setCurrentRound(currentRound);
      setTotalRounds(totalRounds);
      setLetter(letter);
      setCategories(categories || []);
      setCategoryLabels(
        (categoryMeta || []).reduce((acc, { id, name }) => {
          acc[id] = name;
          return acc;
        }, {})
      );
      setEndAt(roundEndTime);
      setAnswers({});
      setSubmitted(false);
      setShowResults(false);
      setAnswerDetails({});
      setBreakEndAt(null);
    };

    const onRoundResults = ({ scores, answers, details, breakEndTime }) => {
      setRoundScores(scores || {});
      setRoundAnswers(answers || {});
      setAnswerDetails(details || {});
      setBreakEndAt(breakEndTime || null);
      setShowResults(true);
    };

    const onGameEnded = () => navigate(`/room/${code}`);

    socket.on("roundStarted", onRoundStarted);
    socket.on("roundResults", onRoundResults);
    socket.on("gameEnded", onGameEnded);
    return () => {
      socket.off("roundStarted", onRoundStarted);
      socket.off("roundResults", onRoundResults);
      socket.off("gameEnded", onGameEnded);
    };
  }, [code, navigate]);

  useEffect(() => {
    if (timeLeft === 0 && endAt && !submitted) {
      socket.emit("submitAnswers", { answers });
      setSubmitted(true);
    }
  }, [timeLeft, endAt, submitted, answers]);

  const handleChange = (key, val) =>
    setAnswers((prev) => ({ ...prev, [key]: val }));
  const handleSubmit = () => {
    if (submitted) return;
    socket.emit("submitAnswers", { answers });
    setSubmitted(true);
  };
  const handleNextRound = () => socket.emit("nextRound");

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

  return (
    <div className="mx-auto py-6 w-[90vw] max-w-[1400px] min-h-[80vh] text-[var(--text)]">
      <div className="gap-4 grid grid-cols-1 lg:grid-cols-4">
        {/* LEFT 3/4 stacks: MAIN (first on mobile) then PLAYERS (second on mobile) */}
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

            {/* Results overlay */}
            {showResults && (
              <div className="absolute inset-0 flex flex-col bg-background/80 backdrop-blur-sm p-6 rounded-2xl">
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
                <div className="gap-4 grid overflow-auto">
                  {categories.map((cid) => (
                    <div key={cid} className="p-3 border rounded-xl">
                      <div className="mb-2 font-semibold text-sm">
                        {categoryLabels[cid] || cid}
                      </div>
                      <div className="space-y-1">
                        {(players || []).map((p) => {
                          const pid = p._id || p;
                          const name =
                            playerNameById[pid] || String(pid).slice(-5);
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
                                <div className="font-medium truncate">
                                  {name}
                                </div>
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

                {/* Totals */}
                <div className="mt-4">
                  <div className="mb-2 font-medium text-sm">Round totals</div>
                  <div className="space-y-2">
                    {Object.entries(roundScores)
                      .sort((a, b) => b[1] - a[1])
                      .map(([pid, pts]) => (
                        <div
                          key={pid}
                          className="flex justify-between items-center px-3 py-2 border rounded-lg"
                        >
                          <div>
                            {playerNameById[pid] || String(pid).slice(-5)}
                          </div>
                          <div className="font-mono">+{pts}</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </GlassCard>

          {/* PLAYERS (under main on mobile, above main on desktop) */}
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
    </div>
  );
}
