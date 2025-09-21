import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "@/lib/socket";
import GlassCard from "@/components/global/GlassCard";
import { useAuth } from "@/context/AuthContext";
import PlayersList from "@/components/PlayersList";
import RoomCodeCard from "@/components/room/RoomCodeCard";
import CategorySelector from "@/components/room/CategorySelector";
import RoomSettingsForm from "@/components/room/RoomSettingsForm";
import api from "@/lib/axios";
import SelectedCategoriesPanel from "@/components/room/SelectedCategoriesPanel";

export default function RoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---- Fetch latest room from backend ----
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

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  // ---- Join room socket ----
  useEffect(() => {
    if (!room?.code || !currentUserId) return;
    socket.emit("joinRoom", { code: room.code, userId: currentUserId });
  }, [room?.code, currentUserId]);

  // ---- Sync room updates from server ----
  useEffect(() => {
    const onRoomUpdated = ({ room }) => setRoom(room);
    socket.on("roomUpdated", onRoomUpdated);
    return () => socket.off("roomUpdated", onRoomUpdated);
  }, []);

  // ---- Refresh on user join/leave ----
  useEffect(() => {
    const handleUserChange = () => fetchRoom();
    socket.on("userJoined", handleUserChange);
    socket.on("userLeft", handleUserChange);
    return () => {
      socket.off("userJoined", handleUserChange);
      socket.off("userLeft", handleUserChange);
    };
  }, [fetchRoom]);

  // ---- Navigate when game starts ----
  useEffect(() => {
    const onRoundStarted = () => navigate(`/game/${code}`);
    const onGameStarted = () => navigate(`/game/${code}`);

    socket.on("roundStarted", onRoundStarted);
    socket.on("gameStarted", onGameStarted);

    return () => {
      socket.off("roundStarted", onRoundStarted);
      socket.off("gameStarted", onGameStarted);
    };
  }, [code, navigate]);

  if (loading)
    return <div className="mt-10 text-center">Се вчитува собата...</div>;
  if (!room) return null;

  const isHost =
    room.host &&
    (room.host._id === currentUserId || room.host === currentUserId);

  // ---- Handlers ----
  const handleLeave = async () => {
    try {
      await api.post("/room/leave", { code: room.code }); // call REST API
      navigate("/main");
    } catch (err) {
      console.error("❌ Failed to leave room:", err);
      alert("Не успеавте да ја напуштите собата.");
    }
  };
  const handleStartGame = async () => {
    await api.patch("/room/update-settings", {
      code: room.code,
      rounds: room.rounds,
      timer: room.timer,
      endMode: room.endMode || "ALL_SUBMIT",
    });
    socket.emit("startGame");
  };

  const handleUpdateSettings = async ({ rounds, timer, endMode }) => {
    await api.patch("/room/update-settings", {
      code: room.code.toUpperCase(),
      rounds,
      timer,
      endMode,
    });
  };

  const handleUpdateCategories = async (categories) => {
    await api.patch("/room/update-categories", {
      code: room.code.toUpperCase(),
      categories,
    });
  };

  // ---- UI ----
  return (
    <div className="flex flex-col gap-1 mx-auto w-full max-w-[90vw]">
      {/* Row 1: Players + Room Code */}
      <div className="flex lg:flex-row flex-col gap-1 w-full h-full">
        <PlayersList
          players={room.players}
          onLeave={handleLeave}
          hostId={room.host?._id}
          className="w-full lg:w-3/4"
        />
        <RoomCodeCard
          code={room.code}
          isHost={isHost}
          className="w-full lg:w-1/4"
        />
      </div>

      {/* Row 2: Settings + Categories + Placeholder */}
      <div className="flex lg:flex-row flex-col gap-1 w-full">
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

        <SelectedCategoriesPanel
          categories={room.categories || []}
          className="lg:w-1/4"
        />
      </div>
    </div>
  );
}
