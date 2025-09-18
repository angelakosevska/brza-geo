import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

// ================== GAME LOGIC HOOK ==================
// This hook manages the lifecycle of the game:
// - handles socket events and syncing state
// - tracks answers, rounds, timers
// - shows WP (Word Power) updates from the backend
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
  const [mode, setMode] = useState("play");
  const [hasMoreRounds, setHasMoreRounds] = useState(true);

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [endAt, setEndAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const [showResults, setShowResults] = useState(false);
  const [roundScores, setRoundScores] = useState({});
  const [roundAnswers, setRoundAnswers] = useState({});
  const [answerDetails, setAnswerDetails] = useState({});
  const [breakEndAt, setBreakEndAt] = useState(null);
  const [breakLeft, setBreakLeft] = useState(0);

  const [showFinal, setShowFinal] = useState(false);
  const [finalTotals, setFinalTotals] = useState({});
  const [finalWinners, setFinalWinners] = useState([]);

  const [serverOffsetMs, setServerOffsetMs] = useState(0);

  // ---------- REFS ----------
  const answersRef = useRef({});
  const endAtRef = useRef(null);
  const joinedRef = useRef(false);

  // ---------- TOASTER ----------
  const { toast } = useToast();

  // Keep refs in sync with state
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    endAtRef.current = endAt;
  }, [endAt]);

  // ---------- HELPERS ----------
  const normalizeId = useCallback(
    (v) => (typeof v === "string" ? v : v?._id ?? String(v ?? "")),
    []
  );

  const isHost = useMemo(
    () => Boolean(hostId && currentUserId && String(hostId) === String(currentUserId)),
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
        socket.emit("joinRoom", { code, userId: currentUserId });
        joinedRef.current = true;
      }
    };

    fetchRoom().finally(tryJoin);
    socket.on("connect", tryJoin);
    return () => socket.off("connect", tryJoin);
  }, [code, currentUserId, fetchRoom]);

  // Cleanup on unmount → leave room
  useEffect(() => {
    return () => {
      if (joinedRef.current) {
        socket.emit("leaveRoom", { code });
        joinedRef.current = false;
      }
    };
  }, [code]);

  // ---------- TIMERS ----------
  // Round countdown
  useEffect(() => {
    const interval = setInterval(() => {
      if (!endAt) return;
      const end = new Date(endAt).getTime();
      const remaining = end - (Date.now() + serverOffsetMs);
      setTimeLeft(remaining > 0 ? Math.ceil(remaining / 1000) : 0);
    }, 250);
    return () => clearInterval(interval);
  }, [endAt, serverOffsetMs]);

  // Break countdown
  useEffect(() => {
    const interval = setInterval(() => {
      if (!breakEndAt) return;
      const end = new Date(breakEndAt).getTime();
      const remaining = end - (Date.now() + serverOffsetMs);
      setBreakLeft(remaining > 0 ? Math.ceil(remaining / 1000) : 0);
    }, 250);
    return () => clearInterval(interval);
  }, [breakEndAt, serverOffsetMs]);

  // ---------- AUTO SUBMIT ----------
  useEffect(() => {
    if (timeLeft === 0 && endAt && !submitted && mode === "play") {
      socket.emit("submitAnswers", { code, answers: answersRef.current });
      setSubmitted(true);
    }
  }, [timeLeft, endAt, submitted, mode, code]);

  // Submit answers before page unload
  useEffect(() => {
    const onBeforeUnload = () => {
      if (!submitted && endAtRef.current && mode === "play") {
        socket.emit("submitAnswers", { code, answers: answersRef.current });
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [submitted, mode, code]);

  // ---------- STATE REHYDRATION ----------
  useEffect(() => {
    socket.emit("getRoundState", { code }, (state) => {
      if (!state) return;

      const {
        currentRound: cr,
        totalRounds: tr,
        letter,
        categories,
        categoryMeta,
        roundEndTime,
        breakEndTime,
        serverNow,
        hasSubmitted,
        phase,
        endMode,
      } = state;

      if (endMode) setEndMode(endMode);
      if (cr != null) setCurrentRound(cr);
      if (tr != null) setTotalRounds(tr);
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

      if (breakEndTime) {
        setMode("review");
        setShowResults(true);
        setBreakEndAt(breakEndTime);
      } else if (phase === "review") {
        setMode("review");
        setShowResults(true);
        setShowFinal(false);
      } else if (phase === "final") {
        setMode("review");
        setShowResults(false);
        setShowFinal(true);
      } else {
        setMode("play");
        setShowResults(false);
        setShowFinal(false);
      }

      if (phase === "play" || (!phase && roundEndTime)) {
        setSubmitted(Boolean(hasSubmitted));
        if (!hasSubmitted) setAnswers({});
      }
    });
  }, [code]);

  // ---------- FETCH DICTIONARIES ----------
  useEffect(() => {
    if (!categories || categories.length === 0) return;

    const fetchDicts = async () => {
      try {
        const res = await api.get("/categories", {
          params: { ids: categories.join(",") },
        });

        const dicts = {};
        const labels = {};

        for (const cat of res.data.categories || []) {
          dicts[cat._id] = (cat.words || []).map((w) =>
            String(w).trim().toLowerCase()
          );
          labels[cat._id] = cat.displayName?.mk || cat.name;
        }

        setDictByCategory(dicts);
        setCategoryLabels((prev) => ({ ...prev, ...labels }));
      } catch (err) {
        console.error("❌ Failed to fetch category dicts:", err);
      }
    };

    fetchDicts();
  }, [categories]);

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

    const handleRoomState = (state) => {
      if (state?.started === false) {
        setMode("review");
        setShowResults(false);
        setShowFinal(false);
        setEndAt(null);
        setBreakEndAt(null);
        setCurrentRound(0);
      }
    };

    const handleSettingsUpdated = ({ endMode, rounds }) => {
      if (typeof endMode === "string") setEndMode(endMode);
      if (typeof rounds === "number") setTotalRounds(rounds);
    };

    const handleForceSubmit = () => {
      socket.emit("submitAnswers", { code, answers: answersRef.current });
      setSubmitted(true);
    };

    const handleRoundSkipped = (payload) => {
      if (payload.currentRound != null) setCurrentRound(payload.currentRound);
      if (payload.totalRounds != null) setTotalRounds(payload.totalRounds);

      setLetter(null);
      setCategories([]);
      setEndAt(null);

      toast({
        title: "Рундата е прескокната",
        description:
          payload.reason === "no-valid-words"
            ? "No words available for this letter."
            : "This round was skipped.",
        variant: "destructive",
        duration: 3000,
      });
    };

    const handleWPUpdate = ({ userId, wordPower, level }) => {
      if (String(userId) === String(currentUserId)) {
        toast({
          title: "Доби поени!",
          description: `Сега имаш ${wordPower} WP • Ниво ${level}`,
        });
      }
    };

    socket.on("roundStarted", handleRoundStarted);
    socket.on("roundResults", handleRoundResults);
    socket.on("gameEnded", handleGameEnded);
    socket.on("playersUpdated", handlePlayersUpdated);
    socket.on("roomUpdated", handleRoomUpdated);
    socket.on("roomState", handleRoomState);
    socket.on("settingsUpdated", handleSettingsUpdated);
    socket.on("forceSubmit", handleForceSubmit);
    socket.on("roundSkipped", handleRoundSkipped);
    socket.on("playerWPUpdated", handleWPUpdate);

    return () => {
      socket.off("roundStarted", handleRoundStarted);
      socket.off("roundResults", handleRoundResults);
      socket.off("gameEnded", handleGameEnded);
      socket.off("playersUpdated", handlePlayersUpdated);
      socket.off("roomUpdated", handleRoomUpdated);
      socket.off("roomState", handleRoomState);
      socket.off("settingsUpdated", handleSettingsUpdated);
      socket.off("forceSubmit", handleForceSubmit);
      socket.off("roundSkipped", handleRoundSkipped);
      socket.off("playerWPUpdated", handleWPUpdate);
    };
  }, [code, normalizeId, toast, currentUserId]);

  // ---------- DEFENSIVE UNLOCK ----------
  useEffect(() => {
    if (
      mode === "play" &&
      endAt &&
      timeLeft > 0 &&
      submitted &&
      Object.keys(answersRef.current || {}).length === 0
    ) {
      setSubmitted(false);
    }
  }, [mode, endAt, timeLeft, submitted]);

  // ---------- HANDLERS ----------
  const handleChange = useCallback((key, val) => {
    setAnswers((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (submitted || mode !== "play") return;
    socket.emit("submitAnswers", { code, answers: answersRef.current });
    setSubmitted(true);
  }, [submitted, mode, code]);

  const handleStopRound = useCallback(() => {
    if (mode !== "play" || endMode !== "PLAYER_STOP") return;
    socket.emit("playerStopRound", { code, answers: answersRef.current });
    setSubmitted(true);
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

  const handleLeaveRoom = useCallback(() => {
    socket.emit("leaveRoom", { code });
    navigate("/main");
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
    wpEarned: currentUserId
      ? Math.floor((finalTotals[currentUserId] || 0) / 2)
      : 0,

    // Handlers
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
