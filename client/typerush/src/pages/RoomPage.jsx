import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import PlayersList from "@/components/PlayersList";
import RoomCodeCard from "@/components/room/RoomCodeCard";
import CategorySelector from "@/components/room/CategorySelector";
import RoomSettingsForm from "@/components/room/RoomSettingsForm";
import api from "@/lib/axios";
import SelectedCategoriesPanel from "@/components/room/SelectedCategoriesPanel";
import { useLoading } from "@/context/LoadingContext";

export default function RoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [room, setRoom] = useState(null);
  const { loading, setLoading } = useLoading(); // ✅ use context

  // ---- Fetch room data from backend ----
  const fetchRoom = useCallback(async () => {
    try {
      setLoading(true); // start loader
      const res = await api.get(`/room/${code}`);
      setRoom(res.data.room);
    } catch (err) {
      const msg = err.response?.data?.message || "Error loading room.";
      alert(msg);
      navigate("/main");
    } finally {
      setLoading(false); // stop loader
    }
  }, [code, navigate, setLoading]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  // ---- Join room via socket ----
  useEffect(() => {
    if (!room?.code) return;
    socket.emit("joinRoom", { code: room.code }); // server gets userId from token
  }, [room?.code]);

  // ---- Sync room updates from server ----
  useEffect(() => {
    const onRoomUpdated = ({ room }) => setRoom(room);
    socket.on("roomUpdated", onRoomUpdated);
    return () => socket.off("roomUpdated", onRoomUpdated);
  }, []);

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

  if (loading) {
    // ✅ show your global spinner/overlay instead of plain text
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="border-[var(--primary)] border-t-[3px] rounded-full w-12 h-12 animate-spin loader" />
      </div>
    );
  }

  if (!room) return null;

  const isHost =
    room.host &&
    (room.host._id === currentUserId || room.host === currentUserId);

  // ---- Leave room ----
  const handleLeave = async () => {
    try {
      await api.post(`/room/${room.code}/leave`);
      socket.emit("leaveRoom", { code: room.code });
      navigate("/main");
    } catch (err) {
      console.error("❌ Failed to leave room:", err);
      alert("Failed to leave the room.");
    }
  };

  // ---- Start game (host only) ----
  const handleStartGame = async () => {
    await api.patch("/room/update-settings", {
      code: room.code,
      rounds: room.rounds,
      timer: room.timer,
      endMode: room.endMode || "ALL_SUBMIT",
    });
    socket.emit("startGame", { code: room.code });
  };

  // ---- Update room settings ----
  const handleUpdateSettings = async ({ rounds, timer, endMode }) => {
    await api.patch("/room/update-settings", {
      code: room.code.toUpperCase(),
      rounds,
      timer,
      endMode,
    });
  };

  // ---- Update room categories ----
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

      {/* Row 2: Settings + Categories + Selected Categories */}
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
