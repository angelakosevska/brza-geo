import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { socket } from "@/lib/socket";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/context/AuthContext";
import { InputCat } from "@/components/ui/inputCat";
import PlayersList from "@/components/PlayersList";
import RoomCodeCard from "@/components/RoomCodeCard";
import CategorySelector from "@/components/CategorySelector";
import RoomSettingsForm from "@/components/RoomSettingsrm";

export default function RoomPage() {
  const { code } = useParams();
  const { user } = useAuth();
  const currentUserId = user?.id;
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // 1. Fetch Room Info
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/room/${code}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (res.ok) {
          setRoom(data.room);
        } else {
          alert(data.message);
          navigate("/main");
        }
      } catch (err) {
        console.error(err);
        alert("Грешка при вчитување на собата.");
        navigate("/main");
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [code, token, navigate]);

  // 2. Socket Join + Sync
  useEffect(() => {
    if (!room || !currentUserId) return;

    const currentUser = room.players.find((p) => p._id === currentUserId);
    if (!currentUser) return;

    socket.emit("joinRoom", {
      roomCode: room.code,
      username: currentUser.username,
    });

    const handleSettings = ({ rounds, timer }) => {
      setRoom((prev) => ({ ...prev, rounds, timer }));
    };

    const handleCategories = ({ categories }) => {
      setRoom((prev) => ({ ...prev, categories }));
    };

    socket.on("settingsUpdated", handleSettings);
    socket.on("categoriesSet", handleCategories);

    return () => {
      socket.off("settingsUpdated", handleSettings);
      socket.off("categoriesSet", handleCategories);
    };
  }, [room, currentUserId]);

  // 3. Listen for gameStarted
  useEffect(() => {
    const handleGameStarted = ({ letter, round }) => {
      console.log("Game started with letter:", letter, "round:", round);
      // You can navigate to /play here
    };

    socket.on("gameStarted", handleGameStarted);
    return () => {
      socket.off("gameStarted", handleGameStarted);
    };
  }, []);

  // 4. Leave Room on Unmount
  useEffect(() => {
    return () => {
      if (room && currentUserId) {
        const currentUser = room.players.find((p) => p._id === currentUserId);
        if (currentUser) {
          socket.emit("leaveRoom", {
            roomCode: room.code,
            username: currentUser.username,
          });
        }
      }
    };
  }, [room, currentUserId]);

  if (loading) return <div className="mt-10 text-center">Loading room...</div>;
  if (!room) return null;

  const isHost =
    room.host &&
    (room.host._id === currentUserId || room.host === currentUserId);

  return (
    <div className="flex flex-col gap-4 mx-auto py-8 w-full max-w-[90vw] min-h-[80vh]">
      <div className="flex lg:flex-row flex-col gap-2 w-full">
        <PlayersList players={room.players} className="w-full lg:w-3/4" />
        <RoomCodeCard
          code={room.code}
          isHost={isHost}
          className="w-full lg:w-1/4"
        />
      </div>
      <div className="flex lg:flex-row flex-col gap-4 w-full">
        <RoomSettingsForm
          room={room}
          onUpdate={({ rounds, timer }) =>
            setRoom((prev) => ({ ...prev, rounds, timer }))
          }
          readOnly={!isHost}
          className="lg:w-1/4"
        />

        <CategorySelector
          room={room}
          selected={room.categories}
          onUpdate={(cats) =>
            setRoom((prev) => ({ ...prev, categories: cats }))
          }
          readOnly={!isHost}
          className="lg:w-2/4"
        />

        <GlassCard className="flex justify-center items-center w-full lg:w-1/4 min-h-[200px]">
          {/* Your image or placeholder here */}
          Image
        </GlassCard>
      </div>
    </div>
  );
}
