import GlassCard from "@/components/global/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useError } from "@/hooks/useError";
import InfoAccordion from "@/components/InfoAccordion";
import LevelCard from "@/components/level/LevelCard";
import CategoriesPanel from "@/components/categories/CategoriesPanel";
import { useLoading } from "@/context/LoadingContext";

export default function MainPage() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const { showError, showSuccess } = useError();
  const { setLoading } = useLoading();

  // Handle create room
  const handleCreateRoom = async () => {
    try {
      setLoading(true);
      const res = await api.post("/room/create", {});
      const { room } = res.data;
      showSuccess(`Room created! Code: ${room.code}`);
      navigate(`/room/${room.code}`);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Server error while creating room.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle join room
  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      showError("Enter a room code.");
      return;
    }
    try {
      setLoading(true);
      await api.post("/room/join", { code: joinCode.toUpperCase() });
      showSuccess(`Joined room ${joinCode.toUpperCase()} successfully.`);
      navigate(`/room/${joinCode.toUpperCase()}`);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Server error while joining room.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gap-1 grid grid-cols-1 lg:grid-cols-3 mx-auto max-w-[95vw] h-full">
      {/* 1. Left column – LevelCard + Info (desktop only) */}
      <div className="flex flex-col gap-1 order-1 col-span-1">
        <LevelCard currentWP={22} level={3} />
        <div className="hidden lg:block">
          <InfoAccordion />
        </div>
      </div>

      {/* 2. Middle column – Create/Join room */}
      <div className="order-2 col-span-1">
        <GlassCard className="flex flex-col justify-center items-center p-6 h-full">
          <div className="flex flex-col justify-center items-center gap-1 w-full max-w-sm">
            {/* Button: create room */}
            <Button className="w-full" onClick={handleCreateRoom}>
              Create room
            </Button>

            <span className="text-[var(--glass)] text-sm">or</span>

            {/* Input + button: join room */}
            <div className="flex flex-col gap-1 w-full">
              <Input
                placeholder="Enter room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
              />
              <Button onClick={handleJoinRoom}>Join room</Button>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 3. Right column – Categories panel */}
      <div className="order-3 col-span-1">
        <CategoriesPanel />
      </div>

      {/* 4. InfoAccordion (mobile only, shown at bottom) */}
      <div className="lg:hidden order-4 col-span-1">
        <InfoAccordion />
      </div>
    </div>
  );
}
