import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import api from "@/lib/axios";
import { useError } from "@/hooks/useError";
import { useLoading } from "@/context/LoadingContext";

// ================== GAME LOGIC HOOK ==================
// This custom React hook manages the entire game lifecycle. (To gamepage-> to components)
//   - Sync state with server through Socket.IO
//   - Track players, rounds, timers, and answers
//   - Handle auto-submission, skips, and results
//   - Display Word Power (WP) updates from backend
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
  const [mode, setMode] = useState("play"); // "play" | "review" (playing or between rounds)
  const [hasMoreRounds, setHasMoreRounds] = useState(true);

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [endAt, setEndAt] = useState(null); // round end time
  const [timeLeft, setTimeLeft] = useState(0); // seconds left

  const [showResults, setShowResults] = useState(false);
  const [roundScores, setRoundScores] = useState({});
  const [roundAnswers, setRoundAnswers] = useState({});
  const [answerDetails, setAnswerDetails] = useState({});
  const [breakEndAt, setBreakEndAt] = useState(null); // break end timestamp
  const [breakLeft, setBreakLeft] = useState(0); // seconds left for break

  const [showFinal, setShowFinal] = useState(false);
  const [finalTotals, setFinalTotals] = useState({});
  const [finalWinners, setFinalWinners] = useState([]);

  const [serverOffsetMs, setServerOffsetMs] = useState(0);

  // ---------- REFS ----------
  const answersRef = useRef({});
  const endAtRef = useRef(null);
  const joinedRef = useRef(false);

  // ---------- HELPERS ----------
  const { showError, showSuccess, showInfo } = useError();
  const { setLoading } = useLoading();

  // Keep latest answers/timer in refs (avoids stale closures)
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
  // Fetch initial room info (players, host, settings)
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

    // Join the room once socket is connected
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
  // Round countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (!endAt) return;
      const end = new Date(endAt).getTime();
      const remaining = end - (Date.now() + serverOffsetMs);
      setTimeLeft(remaining > 0 ? Math.ceil(remaining / 1000) : 0);
    }, 250);
    return () => clearInterval(interval);
  }, [endAt, serverOffsetMs]);

  // Break countdown timer
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
  // Auto-submit answers when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && endAt && !submitted && mode === "play") {
      socket.emit("submitAnswers", { code, answers: answersRef.current });
      setSubmitted(true);
    }
  }, [timeLeft, endAt, submitted, mode, code]);

  // Auto-submit on page unload/refresh
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
  // Fetch latest round state from server (useful on refresh/reconnect)
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

      // Sync phase (play/review/final)
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

      // Sync submission state
      if (phase === "play" || (!phase && roundEndTime)) {
        setSubmitted(Boolean(hasSubmitted));
        if (!hasSubmitted) setAnswers({});
      }
    });
  }, [code]);

  // ---------- FETCH DICTIONARIES ----------
  // Fetch dictionary words for each category (for answer validation)
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
    // Round started
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

    // Round results received
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

    // Game ended → show final results
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

    // Players list updated
    const handlePlayersUpdated = ({ players: list }) => {
      setPlayers(list || []);
    };

    // Room settings updated
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

    // Room reset (back to lobby)
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

    // Settings changed (rounds/endMode)
    const handleSettingsUpdated = ({ endMode, rounds }) => {
      if (typeof endMode === "string") setEndMode(endMode);
      if (typeof rounds === "number") setTotalRounds(rounds);
    };

    // Force submit triggered
    const handleForceSubmit = () => {
      socket.emit("submitAnswers", { code, answers: answersRef.current });
      setSubmitted(true);
    };

    // Word Power updated for a player
    const handleWPUpdate = ({ userId, wordPower, level }) => {
      if (String(userId) === String(currentUserId)) {
        showSuccess(`Доби поени! Сега имаш ${wordPower} WP • Ниво ${level}`);
      }
    };

    // Register listeners
    socket.on("roundStarted", handleRoundStarted);
    socket.on("roundResults", handleRoundResults);
    socket.on("gameEnded", handleGameEnded);
    socket.on("playersUpdated", handlePlayersUpdated);
    socket.on("roomUpdated", handleRoomUpdated);
    socket.on("roomState", handleRoomState);
    socket.on("settingsUpdated", handleSettingsUpdated);
    socket.on("forceSubmit", handleForceSubmit);
    socket.on("playerWPUpdated", handleWPUpdate);

    // Cleanup
    return () => {
      socket.off("roundStarted", handleRoundStarted);
      socket.off("roundResults", handleRoundResults);
      socket.off("gameEnded", handleGameEnded);
      socket.off("playersUpdated", handlePlayersUpdated);
      socket.off("roomUpdated", handleRoomUpdated);
      socket.off("roomState", handleRoomState);
      socket.off("settingsUpdated", handleSettingsUpdated);
      socket.off("forceSubmit", handleForceSubmit);
      socket.off("playerWPUpdated", handleWPUpdate);
    };
  }, [code, normalizeId, currentUserId]);

  // ---------- DEFENSIVE UNLOCK ----------
  // If state desync happens → allow editing again
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
  // Handle input change
  const handleChange = useCallback((key, val) => {
    setAnswers((prev) => ({ ...prev, [key]: val }));
  }, []);

  // Handle "Submit" action
  const handleSubmit = useCallback(() => {
    if (submitted || mode !== "play") return;
    socket.emit("submitAnswers", { code, answers: answersRef.current });
    setSubmitted(true);
    setLoading(true);

    // Stop timer immediately
    setEndAt(null);
    setTimeLeft(0);
  }, [submitted, mode, code]);

  // Handle "Stop Round" action (only if PLAYER_STOP mode)
  const handleStopRound = useCallback(() => {
    if (mode !== "play" || endMode !== "PLAYER_STOP") return;
    socket.emit("playerStopRound", { code, answers: answersRef.current });
    setSubmitted(true);
    setLoading(true);

    // Stop timer immediately
    setEndAt(null);
    setTimeLeft(0);
  }, [mode, endMode, code]);

  // Host: start next round
  const handleNextRound = useCallback(() => {
    if (!isHost) return;
    socket.emit("nextRound", { code });
  }, [isHost, code]);

  // Host: start new game
  const handlePlayAgain = useCallback(() => {
    if (!isHost) return;
    socket.emit("startGame", { code });
  }, [isHost, code]);

  // Go back to room (lobby)
  const handleBackToRoom = useCallback(() => {
    socket.emit("backToLobby", { code });

    navigate(`/room/${code}`);
  }, [code, navigate]);

  // Leave room → back to main menu
  const handleLeaveRoom = useCallback(async () => {
    try {
      // 1. Update server DB
      await api.post(`/room/${code}/leave`);

      // 2. Tell other clients via socket
      socket.emit("leaveRoom", { code, userId: currentUserId });

      // 3. Navigate away
      navigate("/main");
      console.log("Left from modal");
    } catch (err) {
      console.error("❌ Failed to leave room:", err);
      // optional: still try to navigate
      navigate("/main");
    }
  }, [code, currentUserId, navigate]);

  // Stay in final results modal
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
