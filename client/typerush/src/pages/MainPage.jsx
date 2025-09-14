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
      const msg =
        err.response?.data?.message || "Серверска грешка при креирање соба.";
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
      const msg =
        err.response?.data?.message || "Серверска грешка при приклучување.";
      showError(msg);
    } finally {
      setLoadingJoin(false);
    }
  };

  return (
    <div className="gap-1 grid grid-cols-1 lg:grid-cols-3 mx-auto max-w-[95vw] h-full">
      {/* 1. Left (LevelCard + Info за desktop) */}
      <div className="flex flex-col gap-1 order-1 col-span-1">
        <LevelCard currentWP={22} level={3} />

        {/* Show only on desktop */}
        <div className="hidden lg:block">
          <InfoAccordion />
        </div>
      </div>

      {/* 2. Middle (Create/Join) */}
      <div className="order-2 col-span-1">
        <GlassCard className="flex flex-col justify-center items-center p-6 h-full">
          <div className="flex flex-col justify-center items-center gap-1 w-full max-w-sm">
            <Button
              className="w-full"
              onClick={handleCreateRoom}
              disabled={loadingCreate || loadingJoin}
            >
              {loadingCreate ? "Се креира..." : "Креирај соба"}
            </Button>

            <span className="text-[var(--glass)] text-sm">или</span>

            <div className="flex flex-col gap-1 w-full">
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
          </div>
        </GlassCard>
      </div>

      {/* 3. CategoriesPanel */}
      <div className="order-3 col-span-1">
        <CategoriesPanel />
      </div>

      {/* 4. InfoAccordion (само на mobile, долу) */}
      <div className="lg:hidden order-4 col-span-1">
        <InfoAccordion />
      </div>
    </div>
  );
}
