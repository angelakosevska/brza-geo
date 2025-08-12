// src/pages/GamePage.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";

export default function GamePage() {
  // ---- Router / Auth ----
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id;

  // ---- Room/players (for showing names in results) ----
  const [players, setPlayers] = useState([]); // [{_id, username}, ...]
  const [playerNameById, setPlayerNameById] = useState({}); // id -> username

  // ---- Round state ----
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [letter, setLetter] = useState(null);
  const [categories, setCategories] = useState([]);
  const [endAt, setEndAt] = useState(null); // ISO string

  // ---- Answers / timer ----
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // ---- Results overlay ----
  const [showResults, setShowResults] = useState(false);
  const [roundScores, setRoundScores] = useState({}); // userId -> points
  const [roundAnswers, setRoundAnswers] = useState({}); // userId -> {cat: ans}

  // ===== Helpers =====
  const fetchRoom = useCallback(async () => {
    try {
      const res = await api.get(`/room/${code}`);
      const room = res.data.room;
      const map = {};
      (room.players || []).forEach((p) => {
        const id = p._id || p; // populated or id
        const name = p.username || String(p).slice(-5);
        map[id] = name;
      });
      setPlayers(room.players || []);
      setPlayerNameById(map);
    } catch (_) {}
  }, [code]);

  // smooth countdown
  useEffect(() => {
    const t = setInterval(() => {
      if (!endAt) return;
      const ms = new Date(endAt).getTime() - Date.now();
      setTimeLeft(ms > 0 ? Math.ceil(ms / 1000) : 0);
    }, 250);
    return () => clearInterval(t);
  }, [endAt]);

  // join socket room (in case of reload), and fetch room for names
  useEffect(() => {
    fetchRoom();
    if (code && currentUserId) {
      socket.emit("joinRoom", { code, userId: currentUserId });
    }
  }, [code, currentUserId, fetchRoom]);

  // Socket events: round start/results/end
  useEffect(() => {
    const onRoundStarted = ({
      currentRound,
      totalRounds,
      letter,
      categories,
      roundEndTime,
    }) => {
      setCurrentRound(currentRound);
      setTotalRounds(totalRounds);
      setLetter(letter);
      setCategories(categories || []);
      setEndAt(roundEndTime);
      setAnswers({});
      setSubmitted(false);
      setShowResults(false);
    };

    const onRoundResults = ({ round, scores, answers }) => {
      setRoundScores(scores || {});
      setRoundAnswers(answers || {});
      setShowResults(true);
    };

    const onGameEnded = () => {
      // Optionally navigate to a final leaderboard page
      navigate(`/room/${code}`);
    };

    socket.on("roundStarted", onRoundStarted);
    socket.on("roundResults", onRoundResults);
    socket.on("gameEnded", onGameEnded);
    return () => {
      socket.off("roundStarted", onRoundStarted);
      socket.off("roundResults", onRoundResults);
      socket.off("gameEnded", onGameEnded);
    };
  }, [code, navigate]);

  // Auto-submit current answers when timer hits 0 (if not already submitted)
  useEffect(() => {
    if (timeLeft === 0 && endAt && !submitted) {
      socket.emit("submitAnswers", { answers });
      setSubmitted(true);
    }
  }, [timeLeft, endAt, submitted, answers]);

  const handleChange = (cat, val) => {
    setAnswers((prev) => ({ ...prev, [cat]: val }));
  };

  const handleSubmit = () => {
    if (submitted) return;
    socket.emit("submitAnswers", { answers });
    setSubmitted(true);
  };

  // progress percent for a simple bar (optional)
  const progress = useMemo(() => {
    if (!endAt) return 0;
    // We don't know the exact start time here; bar is optional. Keeping it simple.
    return 0;
  }, [endAt]);

  const sortedResults = useMemo(() => {
    // turn {id: pts} into array sorted by pts desc
    const arr = Object.entries(roundScores).map(([id, pts]) => ({
      id,
      pts,
      name: playerNameById[id] || id.slice(-5),
    }));
    arr.sort((a, b) => b.pts - a.pts);
    return arr;
  }, [roundScores, playerNameById]);

  const waitingForRound = !letter || !categories?.length || !endAt;

  return (
    <div className="mx-auto p-4 max-w-3xl">
      <GlassCard className="relative p-6">
        {/* Header: round & timer */}
        <div className="flex justify-between items-center mb-4">
          <div className="font-bold text-lg">
            Round {currentRound || "-"} / {totalRounds || "-"}
          </div>
          <div className="font-mono tabular-nums text-lg">
            {endAt ? `${timeLeft}s` : "--"}
          </div>
        </div>

        {/* Letter */}
        <div className="mb-6 text-center">
          <div className="opacity-70 text-xs">Letter</div>
          <div className="font-extrabold text-5xl tracking-widest">
            {letter ?? "-"}
          </div>
        </div>

        {/* Waiting state */}
        {waitingForRound && (
          <div className="py-12 text-center">
            Waiting for the round to start…
          </div>
        )}

        {/* Inputs */}
        {!waitingForRound && (
          <>
            <div className="gap-4 grid">
              {categories.map((cat) => (
                <div key={cat} className="flex flex-col gap-2">
                  <label className="font-medium text-sm">{cat}</label>
                  <input
                    className="bg-background/60 px-4 py-3 border rounded-xl outline-none w-full"
                    placeholder={`Starts with ${letter}`}
                    value={answers[cat] || ""}
                    onChange={(e) => handleChange(cat, e.target.value)}
                    disabled={submitted || timeLeft === 0}
                  />
                </div>
              ))}
            </div>

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
          </>
        )}

        {/* Results overlay (simple, auto-shown after round) */}
        {showResults && (
          <div className="absolute inset-0 flex flex-col bg-background/80 backdrop-blur-sm p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <div className="font-bold text-lg">
                Round {currentRound} Results
              </div>
              <div className="opacity-70 text-sm">
                Next round starts shortly…
              </div>
            </div>

            <div className="space-y-2 overflow-auto">
              {sortedResults.length === 0 && (
                <div className="opacity-70 text-sm">No submissions.</div>
              )}
              {sortedResults.map(({ id, name, pts }) => (
                <div
                  key={id}
                  className="flex justify-between items-center px-4 py-2 border rounded-xl"
                >
                  <div className="font-medium">{name}</div>
                  <div className="text-sm">
                    <span className="font-mono">+{pts}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Optional: peek answers for yourself */}
            <div className="opacity-70 mt-4 text-xs">
              Your answers:{" "}
              {Object.entries(roundAnswers[currentUserId] || {})
                .map(([c, v]) => `${c}: ${v || "-"}`)
                .join(" · ") || "—"}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
