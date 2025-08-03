import { useEffect, useState } from "react";
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
  const { code } = useParams(); // Room code from URL param
  const { user } = useAuth();
  const currentUserId = user?.id;
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the latest room info from API
  const fetchRoom = async () => {
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
  };

  // === 1. On mount, fetch room data from backend ===
  useEffect(() => {
    fetchRoom();
    // eslint-disable-next-line
  }, [code, navigate]);

  // === 2. When room is loaded, join/leave socket room for real-time updates ===
  useEffect(() => {
    if (room?.code) {
      socket.emit("joinRoom", { code: room.code });
    }
    return () => {
      if (room?.code) {
        socket.emit("leaveRoom", { code: room.code });
      }
    };
  }, [room?.code]);

  // === 3. Listen for real-time full-room updates (host changes anything) ===
  useEffect(() => {
    function onRoomUpdated({ room }) {
      console.log("Received roomUpdated!", room);
      setRoom(room);
    }
    socket.on("roomUpdated", onRoomUpdated);

    return () => {
      socket.off("roomUpdated", onRoomUpdated);
    };
  }, []);

  // === 4. Listen for user join/leave events (update player list if someone enters or leaves) ===
  useEffect(() => {
    const handleUserChange = () => fetchRoom(); // Refetch room from backend
    socket.on("userJoined", handleUserChange);
    socket.on("userLeft", handleUserChange);

    return () => {
      socket.off("userJoined", handleUserChange);
      socket.off("userLeft", handleUserChange);
    };
    // eslint-disable-next-line
  }, [code]);

  // === Loading / Error State UI ===
  if (loading) return <div className="mt-10 text-center">Loading room...</div>;
  if (!room) return null;

  // === Host Check (host gets to edit settings/categories) ===
  const isHost =
    room.host &&
    (room.host._id === currentUserId || room.host === currentUserId);

  // === Render the UI ===
  return (
    <div className="flex flex-col gap-4 mx-auto py-8 w-full max-w-[90vw] min-h-[80vh]">
      {/* Row 1: Player list and Room code */}
      <div className="flex lg:flex-row flex-col gap-2 w-full">
        <PlayersList players={room.players} className="w-full lg:w-3/4" />
        <RoomCodeCard
          code={room.code}
          isHost={isHost}
          className="w-full lg:w-1/4"
        />
      </div>
      {/* Row 2: Room settings, Categories, and (placeholder) image */}
      <div className="flex lg:flex-row flex-col gap-4 w-full">
        <RoomSettingsForm
          room={room}
          onUpdate={async ({ rounds, timer }) => {
            await api.patch("/room/update-settings", {
              code: room.code.toUpperCase(),
              rounds,
              timer,
            });
          }}
          readOnly={!isHost}
          className="lg:w-1/4"
        />
        <CategorySelector
          room={room}
          selected={room.categories}
          onUpdate={async (categories) => {
            await api.post("/room/set-categories", {
              code: room.code.toUpperCase(),
              categories,
            });
          }}
          readOnly={!isHost}
          className="p-4 lg:w-2/4"
        />
        <GlassCard className="flex justify-center items-center w-full lg:w-1/4 min-h-[200px]">
          {/* Your image or placeholder here */}
          Image
        </GlassCard>
      </div>
    </div>
  );
}
