import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import api from "@/lib/axios";

/**
 * Game logic hook:
 * - Round play mode: inputs, countdown, submit (auto/manual)
 * - Review mode: between-round modal with scores + break countdown; host can skip break
 * - Final modal: totals/winners, actions to go back to room / leave / start new game
 */
export default function useGameLogic({ code, currentUserId, navigate }) {
  // -------- Players / host --------
  const [players, setPlayers] = useState([]);
  const [playerNameById, setPlayerNameById] = useState({});
  const [hostId, setHostId] = useState(null);

  // -------- Round state --------
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [letter, setLetter] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryLabels, setCategoryLabels] = useState({});
  const [endAt, setEndAt] = useState(null);

  // -------- Answers / countdown --------
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // -------- Modes --------
  const [mode, setMode] = useState("play"); // "play" | "review"
  const [endMode, setEndMode] = useState("ALL_SUBMIT"); // "ALL_SUBMIT" | "PLAYER_STOP"

  // -------- Between-round (results) modal --------
  const [showResults, setShowResults] = useState(false);
  const [roundScores, setRoundScores] = useState({});
  const [roundAnswers, setRoundAnswers] = useState({});
  const [answerDetails, setAnswerDetails] = useState({});
  const [breakEndAt, setBreakEndAt] = useState(null);
  const [breakLeft, setBreakLeft] = useState(0);

  // -------- Final modal --------
  const [showFinal, setShowFinal] = useState(false);
  const [finalTotals, setFinalTotals] = useState({});
  const [finalWinners, setFinalWinners] = useState([]);

  // -------- Server time skew correction --------
  const [serverOffsetMs, setServerOffsetMs] = useState(0);

  // -------- Refs --------
  const answersRef = useRef({});
  const endAtRef = useRef(null);
  const joinedRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    endAtRef.current = endAt;
  }, [endAt]);

  // -------- Helpers --------
  const normalizeId = (v) =>
    typeof v === "string" ? v : v?._id ?? String(v ?? "");

  const isHost = useMemo(
    () =>
      Boolean(
        hostId && currentUserId && String(hostId) === String(currentUserId)
      ),
    [hostId, currentUserId]
  );

  const waitingForRound = !letter || !categories?.length || !endAt;

  // -------- REST: fetch room (names/host) --------
  const fetchRoom = useCallback(async () => {
    try {
      const res = await api.get(`/room/${code}`);
      const room = res.data.room || {};
      const map = {};
      (room.players || []).forEach((p) => {
        const id = normalizeId(p);
        const name = p.username || String(id).slice(-5);
        map[id] = name;
      });
      setPlayers(room.players || []);
      setPlayerNameById(map);
      setHostId(normalizeId(room.host));
      if (room.endMode) setEndMode(room.endMode);
    } catch {
      // ignore
    }
  }, [code]);

  // -------- Join room once socket+user ready --------
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

  // -------- Leave on unmount --------
  useEffect(() => {
    return () => {
      if (joinedRef.current) {
        socket.emit("leaveRoom", { code });
        joinedRef.current = false;
      }
    };
  }, [code]);

  // -------- Round countdown --------
  useEffect(() => {
    const t = setInterval(() => {
      if (!endAt) return;
      const end = new Date(endAt).getTime();
      const ms = end - (Date.now() + serverOffsetMs);
      setTimeLeft(ms > 0 ? Math.ceil(ms / 1000) : 0);
    }, 250);
    return () => clearInterval(t);
  }, [endAt, serverOffsetMs]);

  // -------- Break countdown --------
  useEffect(() => {
    const t = setInterval(() => {
      if (!breakEndAt) return;
      const end = new Date(breakEndAt).getTime();
      const ms = end - (Date.now() + serverOffsetMs);
      setBreakLeft(ms > 0 ? Math.ceil(ms / 1000) : 0);
    }, 250);
    return () => clearInterval(t);
  }, [breakEndAt, serverOffsetMs]);

  // -------- Auto-submit --------
  useEffect(() => {
    if (timeLeft === 0 && endAt && !submitted && mode === "play") {
      socket.emit("submitAnswers", { code, answers: answersRef.current });
      setSubmitted(true);
    }
  }, [timeLeft, endAt, submitted, mode, code]);

  // -------- Best-effort submit on tab close --------
  useEffect(() => {
    const onBeforeUnload = () => {
      if (!submitted && endAtRef.current && mode === "play") {
        socket.emit("submitAnswers", { code, answers: answersRef.current });
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [submitted, mode, code]);

  // -------- Rehydrate --------
  useEffect(() => {
    socket.emit("getRoundState", { code }, (state) => {
      if (!state) return;
      const {
        round,
        currentRound: cr,
        totalRounds: tr,
        letter,
        categories,
        categoryMeta,
        endsAt,
        roundEndTime,
        breakEndTime,
        serverTime,
        serverNow,
        hasSubmitted,
        phase,
        endMode,
      } = state;

      if (endMode) setEndMode(endMode);
      const end = roundEndTime ?? endsAt ?? null;
      const srv = serverNow ?? serverTime;

      setCurrentRound(cr ?? round ?? 1);
      if (tr != null) setTotalRounds(tr);
      setLetter(letter ?? null);
      setCategories((categories || []).map(String));
      setCategoryLabels(
        (categoryMeta || []).reduce((acc, { id, name }) => {
          acc[String(id)] = name;
          return acc;
        }, {})
      );
      setEndAt(end);
      setServerOffsetMs(typeof srv === "number" ? srv - Date.now() : 0);

      if (breakEndTime) {
        setMode("review");
        setShowResults(true);
        setBreakEndAt(breakEndTime);
      } else if (phase === "review" || phase === "final") {
        setMode("review");
        setShowResults(phase === "review");
        setShowFinal(phase === "final");
      } else {
        setMode("play");
        setShowResults(false);
        setShowFinal(false);
      }

      if (phase === "play" || (!phase && end)) {
        if (typeof hasSubmitted === "boolean") {
          setSubmitted(hasSubmitted);
          if (!hasSubmitted) setAnswers({});
        } else {
          setSubmitted(false);
          setAnswers({});
        }
      }
    });
  }, [code]);

  // -------- Socket listeners --------
  useEffect(() => {
    const onRoundStarted = (payload) => {
      const {
        currentRound,
        round,
        totalRounds,
        letter,
        categories,
        categoryMeta,
        endsAt,
        roundEndTime,
        serverTime,
        serverNow,
        hasSubmitted,
        endMode,
      } = payload;

      if (endMode) setEndMode(endMode);
      const end = roundEndTime ?? endsAt ?? null;
      const srv = serverNow ?? serverTime;

      setCurrentRound(currentRound ?? round ?? 1);
      if (totalRounds != null) setTotalRounds(totalRounds);
      setLetter(letter ?? null);
      setCategories((categories || []).map(String));
      setCategoryLabels(
        (categoryMeta || []).reduce((acc, { id, name }) => {
          acc[String(id)] = name;
          return acc;
        }, {})
      );
      setEndAt(end);
      setServerOffsetMs(typeof srv === "number" ? srv - Date.now() : 0);

      setMode("play");
      setShowResults(false);
      setShowFinal(false);
      setBreakEndAt(null);

      if (typeof hasSubmitted === "boolean") {
        setSubmitted(hasSubmitted);
        if (!hasSubmitted) setAnswers({});
      } else {
        setSubmitted(false);
        setAnswers({});
      }
    };

    const onRoundResults = ({
      scores,
      answers,
      details,
      breakEndTime,
      serverNow,
    }) => {
      setRoundScores(scores || {});
      setRoundAnswers(answers || {});
      setAnswerDetails(details || {});
      setBreakEndAt(breakEndTime || null);

      setMode("review");
      setShowResults(true);

      if (typeof serverNow === "number") {
        setServerOffsetMs(serverNow - Date.now());
      }
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

      setMode("review");
      setShowFinal(true);
    };

    const onPlayersUpdated = ({ players: list }) => setPlayers(list || []);

    const onRoomUpdated = ({ room }) => {
      if (!room) return;
      const normalize = (v) =>
        typeof v === "string" ? v : v?._id ?? String(v ?? "");
      setHostId(normalize(room.host));
      if (room.endMode) setEndMode(room.endMode);
      if (Array.isArray(room.players) && room.players.length) {
        const map = {};
        room.players.forEach((p) => {
          const id = normalize(p);
          const name = p.username || String(id).slice(-5);
          map[id] = name;
        });
        setPlayers(room.players);
        setPlayerNameById((prev) => ({ ...prev, ...map }));
      }
    };

    const onRoomState = (state) => {
      if (!state) return;
      if (state.started === false) {
        setMode("review");
        setShowResults(false);
        setShowFinal(false);
        setEndAt(null);
        setBreakEndAt(null);
        setCurrentRound(0);
      }
    };

    const onSettingsUpdated = ({ timer, rounds, endMode }) => {
      if (typeof endMode === "string") setEndMode(endMode);
      if (typeof rounds === "number") setTotalRounds(rounds);
    };

    socket.on("roundStarted", onRoundStarted);
    socket.on("roundResults", onRoundResults);
    socket.on("gameEnded", onGameEnded);
    socket.on("playersUpdated", onPlayersUpdated);
    socket.on("roomUpdated", onRoomUpdated);
    socket.on("roomState", onRoomState);
    socket.on("settingsUpdated", onSettingsUpdated);

    return () => {
      socket.off("roundStarted", onRoundStarted);
      socket.off("roundResults", onRoundResults);
      socket.off("gameEnded", onGameEnded);
      socket.off("playersUpdated", onPlayersUpdated);
      socket.off("roomUpdated", onRoomUpdated);
      socket.off("roomState", onRoomState);
      socket.off("settingsUpdated", onSettingsUpdated);
    };
  }, []);

  // -------- Defensive unlock --------
  useEffect(() => {
    if (
      mode === "play" &&
      endAt &&
      timeLeft > 0 &&
      submitted === true &&
      Object.keys(answersRef.current || {}).length === 0
    ) {
      setSubmitted(false);
    }
  }, [mode, endAt, timeLeft, currentRound, submitted]);

  // -------- UI handlers --------
  const handleChange = (key, val) =>
    setAnswers((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (submitted || mode !== "play") return;
    socket.emit("submitAnswers", { code, answers: answersRef.current });
    setSubmitted(true);
  };

  const handleNextRound = () => {
    if (!isHost) return;
    socket.emit("nextRound", { code });
  };

  const handleStopRound = () => {
    if (mode !== "play") return;
    if (endMode !== "PLAYER_STOP") return;
    socket.emit("playerStopRound", { code, answers: answersRef.current });
  };

  const handlePlayAgain = () => {
    if (!isHost) return;
    socket.emit("startGame", { code });
  };

  const handleBackToRoom = () => {
    socket.emit("backToLobby", { code });
    navigate(`/room/${code}`);
  };

  const handleLeaveRoom = () => {
    socket.emit("leaveRoom", { code });
    navigate("/main");
  };

  const handleStayHere = () => setShowFinal(false);

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
    answers,
    submitted,
    mode,

    showResults,
    roundScores,
    roundAnswers,
    answerDetails,
    breakEndAt,
    breakLeft,

    showFinal,
    finalTotals,
    finalWinners,

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
