import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlassCard from "@/components/global/GlassCard";
import { PlusCircle, DoorOpen } from "lucide-react";

export default function LobbyCard({ onCreate, onJoin, joinCode, setJoinCode }) {
  const handleJoin = () => {
    if (!joinCode.trim()) return;
    onJoin(joinCode.toUpperCase());
  };

  return (
    <GlassCard className="flex-col justify-center items-center p-4 h-full">
      <div className="flex flex-col justify-center items-center gap-6 w-full max-w-sm">
        {/* --- Host section --- */}
        <div className="flex flex-col items-center w-full text-center">
          <h4 className="mb-2 font-semibold text-[var(--primary)] text-base md:text-lg">
            Креирај нова соба
          </h4>
          <Button
            className="flex justify-center items-center gap-2 w-[70%] text-sm md:text-base"
            onClick={onCreate}
          >
            <PlusCircle className="w-4 h-4 text-[var(--background)]" />
            Креирај соба
          </Button>
          <p className="mt-1 text-[var(--text)] text-xs md:text-sm">
            Креирај соба и играј со пријателите
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 bg-[var(--primary)] h-px" />
          <span className="bg-[var(--primary)]/10 px-3 py-1 rounded-full font-medium text-[var(--primary)] text-xs md:text-sm">
            или
          </span>
          <div className="flex-1 bg-[var(--primary)] h-px" />
        </div>

        {/* --- Join section --- */}
        <div className="flex flex-col items-center w-full text-center">
          <h4 className="mb-2 font-semibold text-[var(--primary)] text-base md:text-lg">
            Влези во соба
          </h4>
          <div className="flex flex-col items-center gap-2 w-full">
            <Input
              placeholder="Внеси го кодот"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              className="w-[70%] text-sm md:text-base text-center"
            />
            <Button
              className="flex justify-center items-center gap-2 w-[70%] text-sm md:text-base"
              onClick={handleJoin}
            >
              <DoorOpen className="w-4 h-4 text-[var(--background)]" />
              Влези во собата
            </Button>
          </div>
          <p className="mt-1 text-[var(--text)] text-xs md:text-sm">
            Внеси го кодот што го сподели пријателот
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
