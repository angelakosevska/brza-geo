const DEV_MOCK = true;

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { socket } from "@/lib/socket";

export default function RoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  // 1. Fetch Room Info
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/rooms/${code}`, {
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

  if (loading) return <div className="text-center mt-10">Loading room...</div>;
  if (!room) return null;

  const isHost =
    room.host &&
    (room.host._id === currentUserId || room.host === currentUserId);

  console.log("room.host:", room.host);
  console.log("currentUserId:", currentUserId);
  console.log("isHost:", isHost);

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <h2 className="text-2xl font-bold text-[var(--primary)] mb-2 text-center">
          Room Code: {room.code}
        </h2>

        <div className="flex flex-col items-center gap-4 mt-4">
          <div>
            <h3 className="text-lg font-semibold">Players:</h3>
            <ul className="text-sm text-[var(--text)]">
              {room.players.map((player, idx) => (
                <li key={idx}>{player.username || "Unknown"}</li>
              ))}
            </ul>
          </div>

          {isHost ? (
            <div className="w-full max-w-md mt-4 flex flex-col gap-4">
              <label>
                Rounds:
                <input
                  type="number"
                  value={room.rounds}
                  onChange={(e) =>
                    setRoom((prev) => ({
                      ...prev,
                      rounds: Number(e.target.value),
                    }))
                  }
                  className="w-full p-2 rounded border"
                />
              </label>

              <label>
                Timer (seconds):
                <input
                  type="number"
                  value={room.timer}
                  onChange={(e) =>
                    setRoom((prev) => ({
                      ...prev,
                      timer: Number(e.target.value),
                    }))
                  }
                  className="w-full p-2 rounded border"
                />
              </label>

              <label>
                Categories (comma-separated):
                <input
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
                  className="w-full p-2 rounded border"
                />
              </label>

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
            <div className="w-full max-w-md mt-4 flex flex-col gap-4 text-center">
              <p>Rounds: {room.rounds}</p>
              <p>Timer: {room.timer} seconds</p>
              <p>
                Categories:{" "}
                {room.categories?.length > 0
                  ? room.categories.join(", ")
                  : "Not set yet"}
              </p>
              <p className="text-sm text-gray-400">
                Waiting for host to start the game...
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
