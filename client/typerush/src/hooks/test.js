import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import api from "@/lib/axios";
import { useError } from "@/hooks/useError";
import { useLoading } from "@/context/LoadingContext";

// =====================================================
// 🎮 useGameLogic Hook
// Centralized state + logic for the game lifecycle
//
// Responsibilities:
// - Manage game state: players, host, rounds, categories, timers
// - Communicate with backend via Socket.IO
// - Handle auto-submission, force-submit, and stop-round flow
// - Sync UI with server updates (round start, results, final scores)
// - Provide handlers for actions: submit, stop, next round, leave, etc.
// =====================================================
export default function useGameLogic({ code, currentUserId, navigate }) {
  // ---------- STATE ----------
  const [players, setPlayers] = useState([]);
  const [playerNameById, setPlayerNameById] = useState({});
  const [hostId, setHostId] = useState(null);

  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [letter, setLetter] = useState(null);

  const [categories, setCategories] = useState([]);
  const [categoryLabels, setCategoryLabels] = useState({});
  const [dictByCategory, setDictByCategory] = useState({});
  const [endMode, setEndMode] = useState("ALL_SUBMIT");

  const [mode, setMode] = useState("play"); // "play" | "review"
  const [hasMoreRounds, setHasMoreRounds] = useState(true);

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const [endAt, setEndAt] = useState(null); // round end timestamp
  const [timeLeft, setTimeLeft] = useState(0); // seconds remaining

  const [showResults, setShowResults] = useState(false);
  const [roundScores, setRoundScores] = useState({});
  const [roundAnswers, setRoundAnswers] = useState({});
  const [answerDetails, setAnswerDetails] = useState({});

  const [breakEndAt, setBreakEndAt] = useState(null); // break end timestamp
  const [breakLeft, setBreakLeft] = useState(0); // seconds remaining for break

  const [showFinal, setShowFinal] = useState(false);
  const [finalTotals, setFinalTotals] = useState({});
  const [finalWinners, setFinalWinners] = useState([]);

  const [serverOffsetMs, setServerOffsetMs] = useState(0);

  // ---------- REFS ----------
  const answersRef = useRef({});
  const endAtRef = useRef(null);
  const joinedRef = useRef(false);

  // ---------- HELPERS ----------
  const { showSuccess } = useError();
  const { setLoading } = useLoading();

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    endAtRef.current = endAt;
  }, [endAt]);

  const normalizeId = useCallback(
    (v) => (typeof v === "string" ? v : v?._id ?? String(v ?? "")),
    []
  );

  const isHost = useMemo(
    () =>
      Boolean(
        hostId && currentUserId && String(hostId) === String(currentUserId)
      ),
    [hostId, currentUserId]
  );

  const waitingForRound = !letter || !categories?.length || !endAt;

  // ---------- API ----------
  const fetchRoom = useCallback(async () => {
    try {
      const res = await api.get(`/room/${code}`);
      const room = res.data.room || {};

      const nameMap = {};
      (room.players || []).forEach((p) => {
        const id = normalizeId(p);
        nameMap[id] = p.username || String(id).slice(-5);
      });

      setPlayers(room.players || []);
      setPlayerNameById(nameMap);
      setHostId(normalizeId(room.host));
      if (room.endMode) setEndMode(room.endMode);
    } catch (err) {
      console.warn("⚠️ Failed to fetch room:", err);
    }
  }, [code, normalizeId]);

  // ---------- SOCKET CONNECTION ----------
  useEffect(() => {
    if (!code || !currentUserId) return;

    const tryJoin = () => {
      if (socket.connected && !joinedRef.current) {
        socket.emit("joinRoom", { code });
        joinedRef.current = true;
      }
    };

    fetchRoom().finally(tryJoin);
    socket.on("connect", tryJoin);
    return () => socket.off("connect", tryJoin);
  }, [code, currentUserId, fetchRoom]);

  // Leave room when unmounted
  useEffect(() => {
    return () => {
      if (joinedRef.current) {
        socket.emit("leaveRoom", { code });
        joinedRef.current = false;
      }
    };
  }, [code]);

  // ---------- TIMERS ----------
  useEffect(() => {
    const interval = setInterval(() => {
      if (!endAt) return;
      const end = new Date(endAt).getTime();
      const remaining = end - (Date.now() + serverOffsetMs);
      setTimeLeft(remaining > 0 ? Math.ceil(remaining / 1000) : 0);
    }, 250);
    return () => clearInterval(interval);
  }, [endAt, serverOffsetMs]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!breakEndAt) return;
      const end = new Date(breakEndAt).getTime();
      const remaining = end - (Date.now() + serverOffsetMs);
      setBreakLeft(remaining > 0 ? Math.ceil(remaining / 1000) : 0);
    }, 250);
    return () => clearInterval(interval);
  }, [breakEndAt, serverOffsetMs]);

  // ---------- AUTO-SUBMISSION ----------
  useEffect(() => {
    if (timeLeft === 0 && endAt && !submitted && mode === "play") {
      socket.emit("submitAnswers", { code, answers: answersRef.current });
      setSubmitted(true);
    }
  }, [timeLeft, endAt, submitted, mode, code]);

  useEffect(() => {
    const onBeforeUnload = () => {
      if (!submitted && endAtRef.current && mode === "play") {
        socket.emit("submitAnswers", { code, answers: answersRef.current });
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [submitted, mode, code]);

  // ---------- SOCKET EVENTS ----------
  useEffect(() => {
    const handleRoundStarted = (payload) => {
      const {
        currentRound,
        totalRounds,
        letter,
        categories,
        categoryMeta,
        roundEndTime,
        serverNow,
        hasSubmitted,
        endMode,
      } = payload;

      if (endMode) setEndMode(endMode);
      if (currentRound != null) setCurrentRound(currentRound);
      if (totalRounds != null) setTotalRounds(totalRounds);
      setLetter(letter || null);
      setCategories((categories || []).map(String));

      const labelMap = (categoryMeta || []).reduce((acc, { id, name }) => {
        acc[String(id)] = name;
        return acc;
      }, {});
      setCategoryLabels(labelMap);

      setEndAt(roundEndTime || null);
      if (typeof serverNow === "number") {
        setServerOffsetMs(serverNow - Date.now());
      }

      setMode("play");
      setShowResults(false);
      setShowFinal(false);
      setBreakEndAt(null);
      setSubmitted(Boolean(hasSubmitted));
      if (!hasSubmitted) setAnswers({});
    };

    const handleRoundResults = ({
      scores,
      answers,
      details,
      breakEndTime,
      serverNow,
      hasMore,
    }) => {
      setLoading(false);
      setRoundScores(scores || {});
      setRoundAnswers(answers || {});
      setAnswerDetails(details || {});
      setBreakEndAt(breakEndTime || null);
      setMode("review");
      setShowResults(true);
      setHasMoreRounds(hasMore !== false);

      if (typeof serverNow === "number") {
        setServerOffsetMs(serverNow - Date.now());
      }
    };

    const handleGameEnded = (payload) => {
      setShowResults(false);
      setBreakEndAt(null);
      setMode("review");
      setShowFinal(true);

      if (payload?.totals) {
        setFinalTotals(payload.totals);
        setFinalWinners(payload.winners || []);
      } else {
        setFinalTotals({});
        setFinalWinners([]);
      }
    };

    const handlePlayersUpdated = ({ players: list }) => {
      setPlayers(list || []);
    };

    const handleRoomUpdated = ({ room }) => {
      if (!room) return;
      setHostId(normalizeId(room.host));
      if (room.endMode) setEndMode(room.endMode);

      if (Array.isArray(room.players) && room.players.length) {
        const nameMap = {};
        room.players.forEach((p) => {
          const id = normalizeId(p);
          nameMap[id] = p.username || String(id).slice(-5);
        });
        setPlayers(room.players);
        setPlayerNameById((prev) => ({ ...prev, ...nameMap }));
      }
    };

    const handleSettingsUpdated = ({ endMode, rounds }) => {
      if (typeof endMode === "string") setEndMode(endMode);
      if (typeof rounds === "number") setTotalRounds(rounds);
    };

    const handleForceSubmit = () => {
      socket.emit("submitAnswers", {
        code,
        answers: answersRef.current,
        forced: true,
      });
      setSubmitted(true);
      setLoading(true);
      setEndAt(null);
      setTimeLeft(0);
    };

    const handleWPUpdate = ({ userId, wordPower, level }) => {
      if (String(userId) === String(currentUserId)) {
        showSuccess(`You gained points! Now at ${wordPower} WP • Level ${level}`);
      }
    };

    socket.on("roundStarted", handleRoundStarted);
    socket.on("roundResults", handleRoundResults);
    socket.on("gameEnded", handleGameEnded);
    socket.on("playersUpdated", handlePlayersUpdated);
    socket.on("roomUpdated", handleRoomUpdated);
    socket.on("settingsUpdated", handleSettingsUpdated);
    socket.on("forceSubmit", handleForceSubmit);
    socket.on("playerWPUpdated", handleWPUpdate);

    return () => {
      socket.off("roundStarted", handleRoundStarted);
      socket.off("roundResults", handleRoundResults);
      socket.off("gameEnded", handleGameEnded);
      socket.off("playersUpdated", handlePlayersUpdated);
      socket.off("roomUpdated", handleRoomUpdated);
      socket.off("settingsUpdated", handleSettingsUpdated);
      socket.off("forceSubmit", handleForceSubmit);
      socket.off("playerWPUpdated", handleWPUpdate);
    };
  }, [code, normalizeId, currentUserId]);

  // ---------- HANDLERS ----------
  const handleChange = useCallback((key, val) => {
    setAnswers((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (submitted || mode !== "play") return;
    socket.emit("submitAnswers", { code, answers: answersRef.current });
    setSubmitted(true);
    setLoading(true);
    setEndAt(null);
    setTimeLeft(0);
  }, [submitted, mode, code]);

  const handleStopRound = useCallback(() => {
    if (mode !== "play" || endMode !== "PLAYER_STOP") return;
    socket.emit("playerStopRound", { code });
    setSubmitted(true);
    setLoading(true);
    setEndAt(null);
    setTimeLeft(0);
  }, [mode, endMode, code]);

  const handleNextRound = useCallback(() => {
    if (!isHost) return;
    socket.emit("nextRound", { code });
  }, [isHost, code]);

  const handlePlayAgain = useCallback(() => {
    if (!isHost) return;
    socket.emit("startGame", { code });
  }, [isHost, code]);

  const handleBackToRoom = useCallback(() => {
    socket.emit("backToLobby", { code });
    navigate(`/room/${code}`);
  }, [code, navigate]);

  const handleLeaveRoom = useCallback(async () => {
    try {
      await api.post(`/room/${code}/leave`);
      socket.emit("leaveRoom", { code });
      navigate("/main");
    } catch (err) {
      console.error("❌ Failed to leave room:", err);
      navigate("/main");
    }
  }, [code, navigate]);

  const handleStayHere = useCallback(() => {
    setShowFinal(false);
  }, []);

  // ---------- RETURN ----------
  return {
    players,
    playerNameById,
    hostId,
    isHost,
    endMode,
    currentRound,
    totalRounds,
    letter,
    endAt,
    timeLeft,
    waitingForRound,
    categories,
    categoryLabels,
    dictByCategory,
    answers,
    submitted,
    mode,
    hasMoreRounds,
    showResults,
    roundScores,
    roundAnswers,
    answerDetails,
    breakEndAt,
    breakLeft,
    showFinal,
    finalTotals,
    finalWinners,

    // Actions
    handleChange,
    handleSubmit,
    handleStopRound,
    handleNextRound,
    handlePlayAgain,
    handleBackToRoom,
    handleLeaveRoom,
    handleStayHere,
  };
}
