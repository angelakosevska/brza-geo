import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { socket } from "@/lib/socket";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/context/AuthContext";
import { InputCat } from "@/components/ui/inputCat";
import PlayersList from "@/components/PlayersList";
import RoomCodeCard from "@/components/RoomCodeCard";

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
        <GlassCard className="gap-4 p-4 w-full lg:w-3/4">
          <div className="flex flex-col items-center">
            {isHost ? (
              <div className="flex flex-col gap-6 w-full">
                {/* Rounds, Timer, Categories, Save/Start buttons */}
                <InputCat
                  type="number"
                  value={room.rounds}
                  onChange={(e) =>
                    setRoom((prev) => ({
                      ...prev,
                      rounds: Number(e.target.value),
                    }))
                  }
                  label="Number of rounds"
                  placeholder="Total number of Rounds"
                  min={1}
                  className="mb-2"
                />

                <InputCat
                  type="number"
                  value={room.timer}
                  onChange={(e) =>
                    setRoom((prev) => ({
                      ...prev,
                      timer: Number(e.target.value),
                    }))
                  }
                  label="Time per round (seconds)"
                  placeholder="Time in seconds"
                  min={10}
                  className="mb-2"
                />

                <InputCat
                  type="text"
                  value={room.categories?.join(", ") || ""}
                  onChange={(e) =>
                    setRoom((prev) => ({
                      ...prev,
                      categories: e.target.value
                        .split(",")
                        .map((c) => c.trim())
                        .filter((c) => c !== ""),
                    }))
                  }
                  label="Select categories"
                  placeholder="e.g. City, Country, Animal"
                  className="mb-2"
                />
                <span className="-mt-2 mb-4 ml-2 text-[var(--secondary)] text-xs">
                  (Separate categories with commas)
                </span>

                <Button
                  variant="outline"
                  onClick={() => {
                    socket.emit("updateSettings", {
                      roomCode: room.code,
                      rounds: room.rounds,
                      timer: room.timer,
                    });

                    socket.emit("setCategories", {
                      roomCode: room.code,
                      categories: room.categories,
                    });

                    alert("Settings sent to players.");
                  }}
                >
                  Save Settings
                </Button>

                <Button
                  className="w-full"
                  onClick={async () => {
                    const res = await fetch(
                      "http://localhost:5000/api/rooms/start",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ code: room.code }),
                      }
                    );

                    const data = await res.json();
                    if (res.ok) {
                      socket.emit("startGame", {
                        roomCode: room.code,
                        letter: data.room.letter,
                        round: data.room.currentRound,
                      });
                    } else {
                      alert(data.message);
                    }
                  }}
                >
                  Start Game
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 p-6 w-full max-w-md">
                {/* Stats */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-[var(--primary)]/10 px-3 py-1 rounded-full font-semibold text-[var(--primary)]">
                      Rounds
                    </span>
                    <span className="ml-auto font-bold text-[var(--primary)]">
                      {room.rounds}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-[var(--primary)]/10 px-3 py-1 rounded-full font-semibold text-[var(--primary)]">
                      Timer
                    </span>
                    <span className="ml-auto font-bold text-[var(--primary)]">
                      {room.timer}{" "}
                      <span className="font-normal text-xs">sec</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-[var(--primary)]/10 px-3 py-1 rounded-full font-semibold text-[var(--primary)]">
                      Categories
                    </span>
                    <span className="ml-auto text-right">
                      {room.categories?.length > 0 ? (
                        <span className="font-bold text-[var(--primary)]">
                          {room.categories.join(", ")}
                        </span>
                      ) : (
                        <span className="text-[var(--secondary)] italic">
                          Not set yet
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                {/* Status message */}
                <p className="mt-2 text-[var(--secondary)] text-sm text-center">
                  Waiting for host to start the game...
                </p>
              </div>
            )}
          </div>
        </GlassCard>
        <GlassCard className="flex justify-center items-center w-full lg:w-1/4 min-h-[200px]">
          {/* Your image or placeholder here */}
          Image
        </GlassCard>
      </div>
    </div>
  );
}
