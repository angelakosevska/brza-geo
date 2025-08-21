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
  const [categoryLabels, setCategoryLabels] = useState({}); // id -> label
  const [endAt, setEndAt] = useState(null); // epoch ms or ISO string

  // -------- Answers / countdown --------
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // -------- Modes --------
  // "play"  : during round (inputs are live)
  // "review": between rounds (results modal) or after game (final modal)
  const [mode, setMode] = useState("play"); // "play" | "review"

  // -------- Between-round (results) modal --------
  const [showResults, setShowResults] = useState(false);
  const [roundScores, setRoundScores] = useState({});    // { [pid]: pts }
  const [roundAnswers, setRoundAnswers] = useState({});  // optional snapshot
  const [answerDetails, setAnswerDetails] = useState({});// { [pid]: { [cid]: {value,valid,unique,points,reason} } }
  const [breakEndAt, setBreakEndAt] = useState(null);    // epoch/ISO
  const [breakLeft, setBreakLeft] = useState(0);

  // -------- Final modal --------
  const [showFinal, setShowFinal] = useState(false);
  const [finalTotals, setFinalTotals] = useState({});     // { [pid]: pts }
  const [finalWinners, setFinalWinners] = useState([]);   // [pid]

  // -------- Server time skew correction --------
  // Store (serverNow - clientNow). Then use: endAt - (Date.now() + offset)
  const [serverOffsetMs, setServerOffsetMs] = useState(0);

  // -------- Refs --------
  const answersRef = useRef({});
  const endAtRef = useRef(null);
  const joinedRef = useRef(false);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { endAtRef.current = endAt; }, [endAt]);

  // -------- Helpers --------
  const normalizeId = (v) => (typeof v === "string" ? v : v?._id ?? String(v ?? ""));

  const isHost = useMemo(
    () => Boolean(hostId && currentUserId && String(hostId) === String(currentUserId)),
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

  // -------- Round countdown (drift-free) --------
  useEffect(() => {
    const t = setInterval(() => {
      if (!endAt) return;
      const end = new Date(endAt).getTime();
      const ms = end - (Date.now() + serverOffsetMs);
      setTimeLeft(ms > 0 ? Math.ceil(ms / 1000) : 0);
    }, 250);
    return () => clearInterval(t);
  }, [endAt, serverOffsetMs]);

  // -------- Break countdown (between rounds) --------
  useEffect(() => {
    const t = setInterval(() => {
      if (!breakEndAt) return;
      const end = new Date(breakEndAt).getTime();
      const ms = end - (Date.now() + serverOffsetMs);
      setBreakLeft(ms > 0 ? Math.ceil(ms / 1000) : 0);
    }, 250);
    return () => clearInterval(t);
  }, [breakEndAt, serverOffsetMs]);

  // -------- Auto-submit when timer hits 0 --------
  useEffect(() => {
    if (timeLeft === 0 && endAt && !submitted && mode === "play") {
      socket.emit("submitAnswers", { answers: answersRef.current });
      setSubmitted(true);
    }
  }, [timeLeft, endAt, submitted, mode]);

  // -------- Best-effort submit on tab close --------
  useEffect(() => {
    const onBeforeUnload = () => {
      if (!submitted && endAtRef.current && mode === "play") {
        socket.emit("submitAnswers", { answers: answersRef.current });
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [submitted, mode]);

  // -------- Rehydrate on mount (never miss first round / review) --------
  useEffect(() => {
    socket.emit("getRoundState", { code }, (state) => {
      if (!state) return;

      const {
        // round context
        round,
        currentRound: cr,
        totalRounds: tr,
        letter,
        categories,
        categoryMeta,

        // timing
        endsAt,
        roundEndTime,
        breakEndTime,
        serverTime,
        serverNow,

        // per-user submission (optional from server)
        hasSubmitted,

        // phase
        phase, // "play" | "review" | "final" (optional)
      } = state;

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

      // Phase handling
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

      // Submission state on rehydrate:
      if (phase === "play" || (!phase && end)) {
        // Respect server if provided; otherwise allow typing
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
        currentRound, round, totalRounds, letter,
        categories, categoryMeta,
        endsAt, roundEndTime,
        serverTime, serverNow,

        // optional per-user submission on new round (usually false)
        hasSubmitted,
      } = payload;

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

      // Enter play
      setMode("play");
      setShowResults(false);
      setShowFinal(false);
      setBreakEndAt(null);

      // Reset submission for fresh round (or respect server)
      if (typeof hasSubmitted === "boolean") {
        setSubmitted(hasSubmitted);
        if (!hasSubmitted) setAnswers({});
      } else {
        setSubmitted(false);
        setAnswers({});
      }
    };

    // { scores, answers, details, breakEndTime, serverNow }
    const onRoundResults = ({ scores, answers, details, breakEndTime, serverNow }) => {
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

    // { totals, winners }
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
      const normalize = (v) => (typeof v === "string" ? v : v?._id ?? String(v ?? ""));
      setHostId(normalize(room.host));
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

  // -------- Defensive unlock: never get stuck with submitted=true in play --------
  useEffect(() => {
    // If we are in play, have an end time and time left,
    // but submitted===true AND we have no answers yet -> unlock.
    if (
      mode === "play" &&
      endAt &&
      timeLeft > 0 &&
      submitted === true &&
      Object.keys(answersRef.current || {}).length === 0
    ) {
      setSubmitted(false);
    }
  }, [mode, endAt, timeLeft, currentRound]);

  // -------- UI handlers returned to components --------
  const handleChange = (key, val) =>
    setAnswers((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (submitted || mode !== "play") return;
    socket.emit("submitAnswers", { answers: answersRef.current });
    setSubmitted(true);
  };

  // Host: skip break / start next round
  const handleNextRound = () => {
    if (!isHost) return;
    socket.emit("nextRound");
  };

  // Host: end the round immediately for everyone
  // Change event name if your server uses "stopRound" / "forceEndRound".
  const handleStopRound = () => {
    if (!isHost) return;
    socket.emit("endRound");
  };

  // Final modal actions
  const handlePlayAgain = () => {
    if (!isHost) return;
    socket.emit("startGame"); // server should emit roundStarted
  };

  const handleBackToRoom = () => navigate(`/room/${code}`);

  const handleLeaveRoom = () => {
    socket.emit("leaveRoom", { code });
    navigate("/main");
  };

  const handleStayHere = () => setShowFinal(false);

  return {
    // base UI state
    players,
    playerNameById,
    isHost,
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

    // between-round modal
    showResults,
    roundScores,
    roundAnswers,
    answerDetails,
    breakEndAt,
    breakLeft,

    // final modal
    showFinal,
    finalTotals,
    finalWinners,

    // actions
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
