import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "@/lib/socket";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/context/AuthContext";
import PlayersList from "@/components/PlayersList";
import RoomCodeCard from "@/components/room/RoomCodeCard";
import CategorySelector from "@/components/room/CategorySelector";
import RoomSettingsForm from "@/components/room/RoomSettingsForm";
import api from "@/lib/axios";

export default function RoomPage() {
  // ---- Router / Auth ----
  // Read the room code from the URL (e.g., /room/ZUQ8C) and get navigation helper.
  const { code } = useParams();
  const navigate = useNavigate();

  // Current logged-in user (AuthContext); we only need their id in this component.
  const { user } = useAuth();
  const currentUserId = user?.id;

  // ---- State ----
  // room: the full room document (host, players, rounds, timer, categories, etc.)
  // loading: while we fetch the room on first load / code change.
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---- API: fetch latest room (REST) ----
  // Wrapped in useCallback so effects can depend on a stable function reference.
  const fetchRoom = useCallback(async () => {
    try {
      const res = await api.get(`/room/${code}`);
      setRoom(res.data.room);
    } catch (err) {
      // Localized fallback error message (Macedonian).
      const msg =
        err.response?.data?.message || "Грешка при вчитување на собата.";
      alert(msg);
      // If we can’t fetch the room, send the user back to the main screen.
      navigate("/main");
    } finally {
      setLoading(false);
    }
  }, [code, navigate]);

  // 1) Initial fetch on mount / code change
  // Fetch room from the server to populate UI with the latest persisted state.
  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  // 2) Join the socket room when we have both room code and userId
  // This avoids emitting too early (e.g., before auth/user is loaded).
  useEffect(() => {
    if (!room?.code || !currentUserId) return;
    socket.emit("joinRoom", { code: room.code, userId: currentUserId });
  }, [room?.code, currentUserId]);

  // 3) Realtime room updates (authoritative push from server)
  // The server can broadcast full room snapshots; we simply replace local state.
  useEffect(() => {
    const onRoomUpdated = ({ room }) => setRoom(room);
    socket.on("roomUpdated", onRoomUpdated);
    return () => socket.off("roomUpdated", onRoomUpdated);
  }, []);

  // 4) Optional: if your server emits userJoined/userLeft events
  // We call fetchRoom() to reconcile with backend state (useful if server doesn’t push full snapshots).
  useEffect(() => {
    const handleUserChange = () => fetchRoom();
    socket.on("userJoined", handleUserChange);
    socket.on("userLeft", handleUserChange);
    return () => {
      socket.off("userJoined", handleUserChange);
      socket.off("userLeft", handleUserChange);
    };
  }, [fetchRoom]);

  // 5) Game flow navigation: when the first round starts, move everyone to /game/:code
  // Some servers emit gameStarted slightly earlier; we listen to both and navigate.
  useEffect(() => {
    const onRoundStarted = (payload) => {
      console.log("roundStarted ->", payload);
      navigate(`/game/${code}`);
    };
    const onGameStarted = (payload) => {
      console.log("gameStarted ->", payload);
      // Fallback: ensure navigation if only gameStarted is emitted.
      navigate(`/game/${code}`);
    };

    socket.on("roundStarted", onRoundStarted);
    socket.on("gameStarted", onGameStarted);

    return () => {
      socket.off("roundStarted", onRoundStarted);
      socket.off("gameStarted", onGameStarted);
    };
  }, [code, navigate]);

  // ---- Guarded render paths ----
  if (loading) return <div className="mt-10 text-center">Loading room...</div>;
  if (!room) return null;

  // Determine if the current user is the host.
  const isHost =
    room.host &&
    (room.host._id === currentUserId || room.host === currentUserId);

  // ---- Handlers ----

  // Leave the room (socket) and go back to the main screen.
  const handleLeave = () => {
    socket.emit("leaveRoom", { code });
    navigate("/main");
  };

  // Host action: start the game.
  // We persist the latest settings first (in case the host changed them just now),
  // then emit the socket event. Server uses socket.data.{roomCode,userId}.
  const handleStartGame = async () => {
    await api.patch("/room/update-settings", {
      code: room.code,
      rounds: room.rounds,
      timer: room.timer,
    });
    socket.emit("startGame");
  };

  // Host action: update rounds/timer via REST.
  // Server is expected to broadcast "roomUpdated" after updating, so UI stays in sync.
  const handleUpdateSettings = async ({ rounds, timer }) => {
    await api.patch("/room/update-settings", {
      code: room.code.toUpperCase(),
      rounds,
      timer,
    });
  };

  // Host action: update selected categories via REST.
  // As above, server should push a "roomUpdated" snapshot after saving.
  const handleUpdateCategories = async (categories) => {
    await api.post("/room/set-categories", {
      code: room.code.toUpperCase(),
      categories,
    });
  };

  // ---- UI ----
  // Two stacked rows:
  // Row 1 -> Players list + Room code card
  // Row 2 -> Settings form + Category selector + (placeholder) right-side card
  return (
    <div className="flex flex-col gap-4 mx-auto py-8 w-full max-w-[90vw] min-h-[80vh]">
      {/* Row 1: Players + Room Code */}
      <div className="flex lg:flex-row flex-col gap-2 w-full">
        <PlayersList
          players={room.players}
          onLeave={handleLeave}
          className="w-full lg:w-3/4"
        />
        <RoomCodeCard
          code={room.code}
          isHost={isHost}
          className="w-full lg:w-1/4"
        />
      </div>

      {/* Row 2: Settings + Categories + Placeholder */}
      <div className="flex lg:flex-row flex-col gap-4 w-full">
        <RoomSettingsForm
          room={room}
          onUpdate={handleUpdateSettings}
          onStart={isHost ? handleStartGame : undefined}
          readOnly={!isHost}
          className="lg:w-1/4"
        />

        <CategorySelector
          room={room}
          selected={room.categories}
          onUpdate={handleUpdateCategories}
          readOnly={!isHost}
          className="p-4 lg:w-2/4"
        />

        <GlassCard className="flex justify-center items-center w-full lg:w-1/4 min-h-[200px]">
          Image
        </GlassCard>
      </div>
    </div>
  );
}
