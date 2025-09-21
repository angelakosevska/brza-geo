import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/global/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { useError } from "@/hooks/useError";
import InfoAccordion from "@/components/InfoAccordion";
import LevelCard from "@/components/level/LevelCard";
import CategoriesPanel from "@/components/categories/CategoriesPanel";
import { useLoading } from "@/context/LoadingContext";
import { useAuth } from "@/context/AuthContext";
import { socket } from "@/lib/socket";
import { PlusCircle, DoorOpen } from "lucide-react";
import LobbyCard from "@/components/LobbyCard";

export default function MainPage() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const { showError, showSuccess } = useError();
  const { setLoading } = useLoading();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  // Fetch profile on mount
  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      try {
        const res = await api.get(`/user/profile/${user.id}`);
        setProfile(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch profile:", err);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Listen for WP updates from server
  useEffect(() => {
    if (!user?.id) return;

    const handleWPUpdate = ({ userId, wordPower, level }) => {
      if (String(userId) === String(user.id)) {
        setProfile((prev) => ({
          ...prev,
          wordPower,
          level,
        }));
      }
    };

    socket.on("playerWPUpdated", handleWPUpdate);
    return () => socket.off("playerWPUpdated", handleWPUpdate);
  }, [user?.id]);

  // Handle create room
  const handleCreateRoom = async () => {
    try {
      setLoading(true);
      const res = await api.post("/room/create", {});
      const { room } = res.data;
      showSuccess(`Собата е креирана! Код: ${room.code}`);
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
      showSuccess(`Успешно се приклучи во собата ${joinCode.toUpperCase()}.`);
      navigate(`/room/${joinCode.toUpperCase()}`);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Проблем на серверот при креирање на собата.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gap-1 grid grid-cols-1 lg:grid-cols-3 mx-auto w-full max-w-[95vw]">
      {/* 1. Left column – LevelCard + Info */}
      <div className="flex flex-col gap-1 order-1 col-span-1">
        <LevelCard
          level={profile?.level || 1}
          wordPower={profile?.wordPower || 0}
          wpAtLevelStart={profile?.wpAtLevelStart || 0}
          wpForNextLevel={profile?.wpForNextLevel || 100}
          currentLevelWP={profile?.currentLevelWP || 0}
          progressPercent={profile?.progressPercent || 0}
        />

        <div className="hidden lg:block h-full">
          <InfoAccordion />
        </div>
      </div>

      {/* 2. Middle column – Game Lobby */}
      <div className="order-2 col-span-1">
        <LobbyCard
          onCreate={handleCreateRoom}
          onJoin={handleJoinRoom}
          joinCode={joinCode}
          setJoinCode={setJoinCode}
        />
      </div>

      {/* 3. Right column – Categories panel */}
      <div className="order-3 col-span-1">
        <CategoriesPanel />
      </div>

      {/* 4. InfoAccordion (mobile only) */}
      <div className="lg:hidden order-4 col-span-1">
        <InfoAccordion />
      </div>
    </div>
  );
}
