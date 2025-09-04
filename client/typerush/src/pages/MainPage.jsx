import GlassCard from "@/components/GlassCard";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input copy";
import api from "@/lib/axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function MainPage() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");

  const handleCreateRoom = async () => {
    try {
      const res = await api.post("/room/create", {});
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
      <div className="flex lg:flex-row flex-col gap-6 mx-auto py-8 max-w-[90vw] h-[100%]">
        {/* Main card: 3/4 width on desktop, full width on mobile */}
        <GlassCard className="flex flex-1 lg:flex-[3] justify-center items-center">
          <div className="flex flex-col justify-center items-center gap-6 px-2 w-full">
            <Button className="w-full max-w-xs" onClick={handleCreateRoom}>
              Креирај соба
            </Button>
            <span className="text-gray-500 text-sm">или</span>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Input
                placeholder="Внеси код од соба"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <Button onClick={handleJoinRoom}>Влези во собата</Button>
            </div>
            <Button variant="outline" className="w-full max-w-xs">
              Види ги категориите
            </Button>
          </div>
        </GlassCard>

         {/*//Image card: 1/4 width on desktop, full width on mobile */}
        <GlassCard className="flex flex-1 lg:flex-[1] justify-center items-center">
          <img
            src="/your-image.jpg"
            alt="Preview"
            className="rounded-xl max-w-full max-h-64 object-contain"
          />
        </GlassCard>
      </div>
    </>
  );
}
