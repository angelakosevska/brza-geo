import GlassCard from "@/components/GlassCard";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input copy";
import api from "@/lib/axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function MainPage() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const { token } = useAuth();

  const handleCreateRoom = async () => {
    if (!token) {
      return alert("Мора да сте логирани за да креирате соба.");
    }

    try {
      const res = await api.post("/room/create", {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const { room } = res.data;
      navigate(`/room/${room.code}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Server error";
      alert(msg);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return alert("Внесете код за соба.");

    try {
      await api.post("/room/join", { code: joinCode.toUpperCase() });
      navigate(`/room/${joinCode.toUpperCase()}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Server error";
      alert(msg);
    }
  };

  return (
    <>
      <Header />
      <div className="flex flex-col lg:flex-row max-w-[90vw] w-full mx-auto gap-6 py-8">
        <GlassCard>
          <div className="flex w-full lg:w-2/3 mx-auto gap-8 px-2">
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Button className="w-full max-w-xs" onClick={handleCreateRoom}>
                Create a room
              </Button>
              <span className="text-sm text-gray-500">or</span>
              <div className="w-full max-w-xs flex flex-col gap-2">
                <Input
                  placeholder="Enter room code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <Button onClick={handleJoinRoom}>Join a room</Button>
              </div>
              <Button variant="outline" className="w-full max-w-xs">
                Categories
              </Button>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="w-full lg:w-1/3"> image</GlassCard>
      </div>
    </>
  );
}
