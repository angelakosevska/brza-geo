import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useError } from "@/hooks/useError";

export default function MainPage() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const { showError, showSuccess } = useError();

  const handleCreateRoom = async () => {
    try {
      setLoadingCreate(true);
      const res = await api.post("/room/create", {});
      const { room } = res.data;

      showSuccess(`Собата е креирана! Код: ${room.code}`);
      navigate(`/room/${room.code}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Серверска грешка при креирање соба.";
      showError(msg);
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      showError("Внесете код за соба.");
      return;
    }
    try {
      setLoadingJoin(true);
      await api.post("/room/join", { code: joinCode.toUpperCase() });

      showSuccess(`Успешно се приклучивте во собата ${joinCode.toUpperCase()}`);
      navigate(`/room/${joinCode.toUpperCase()}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Серверска грешка при приклучување.";
      showError(msg);
    } finally {
      setLoadingJoin(false);
    }
  };

  return (
    <div className="flex lg:flex-row flex-col gap-1 mx-auto max-w-[90vw] h-[100%]">
      {/* Main card */}
      <GlassCard className="flex flex-1 lg:flex-[3] justify-center items-center">
        <div className="flex flex-col justify-center items-center gap-6 px-2 w-full">
          <Button
            className="w-full max-w-xs"
            onClick={handleCreateRoom}
            disabled={loadingCreate || loadingJoin}
          >
            {loadingCreate ? "Се креира..." : "Креирај соба"}
          </Button>

          <span className="text-gray-500 text-sm">или</span>

          <div className="flex flex-col gap-2 w-full max-w-xs">
            <Input
              placeholder="Внеси код од соба"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
              disabled={loadingCreate || loadingJoin}
            />
            <Button
              onClick={handleJoinRoom}
              disabled={loadingJoin || loadingCreate}
            >
              {loadingJoin ? "Се приклучува..." : "Влези во собата"}
            </Button>
          </div>

          <Button variant="outline" className="w-full max-w-xs">
            Види ги категориите
          </Button>
        </div>
      </GlassCard>

      {/* Image card */}
      <GlassCard className="flex flex-1 lg:flex-[1] justify-center items-center">
        placeholder
      </GlassCard>
    </div>
  );
}
