import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "@/lib/socket";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/context/AuthContext";
import PlayersList from "@/components/PlayersList";
import RoomCodeCard from "@/components/RoomCodeCard";
import CategorySelector from "@/components/CategorySelector";
import RoomSettingsForm from "@/components/RoomSettingsForm";
import api from "@/lib/axios";

export default function RoomPage() {
  // ---- Router / Auth ----
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id;

  // ---- State ----
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---- API: fetch latest room (REST) ----
  const fetchRoom = useCallback(async () => {
    try {
      const res = await api.get(`/room/${code}`);
      setRoom(res.data.room);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Грешка при вчитување на собата.";
      alert(msg);
      navigate("/main");
    } finally {
      setLoading(false);
    }
  }, [code, navigate]);

  // 1) Initial fetch on mount / code change
  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  // 2) Join the socket room when we have both room code and userId; leave on unmount
  useEffect(() => {
    if (!room?.code || !currentUserId) return;
    socket.emit("joinRoom", { code: room.code, userId: currentUserId });
  }, [room?.code, currentUserId]);

  // 3) Realtime room updates (authoritative push from server)
  useEffect(() => {
    const onRoomUpdated = ({ room }) => setRoom(room);
    socket.on("roomUpdated", onRoomUpdated);
    return () => socket.off("roomUpdated", onRoomUpdated);
  }, []);

  // 4) Optional: if your server emits userJoined/userLeft (otherwise you can remove this)
  useEffect(() => {
    const handleUserChange = () => fetchRoom();
    socket.on("userJoined", handleUserChange);
    socket.on("userLeft", handleUserChange);
    return () => {
      socket.off("userJoined", handleUserChange);
      socket.off("userLeft", handleUserChange);
    };
  }, [fetchRoom]);

  // 5) Game flow navigation: when first round starts, move everyone to /game/:code
  useEffect(() => {
    const onRoundStarted = (payload) => {
      console.log("roundStarted ->", payload);
      navigate(`/game/${code}`);
    };
    const onGameStarted = (payload) => {
      console.log("gameStarted ->", payload);
      // fallback: some servers emit this slightly earlier
      navigate(`/game/${code}`);
    };

    socket.on("roundStarted", onRoundStarted);
    socket.on("gameStarted", onGameStarted);

    return () => {
      socket.off("roundStarted", onRoundStarted);
      socket.off("gameStarted", onGameStarted);
    };
  }, [code, navigate]);

  // ---- Derived ----
  if (loading) return <div className="mt-10 text-center">Loading room...</div>;
  if (!room) return null;

  const isHost =
    room.host &&
    (room.host._id === currentUserId || room.host === currentUserId);

  // ---- Handlers ----
  const handleLeave = () => {
    socket.emit("leaveRoom", { code });
    navigate("/main");
  };

  const handleStartGame = async () => {
    // Optional: save latest settings right before starting
    // await api.patch("/room/update-settings", { code: room.code, rounds: room.rounds, timer: room.timer });
    socket.emit("startGame"); // server uses socket.data.{roomCode,userId}
  };

  const handleUpdateSettings = async ({ rounds, timer }) => {
    await api.patch("/room/update-settings", {
      code: room.code.toUpperCase(),
      rounds,
      timer,
    });
  };

  const handleUpdateCategories = async (categories) => {
    await api.post("/room/set-categories", {
      code: room.code.toUpperCase(),
      categories,
    });
  };

  // ---- UI ----
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
