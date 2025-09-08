import GlassCard from "@/components/global/GlassCard";
import { Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PlayersList({
  players = [],
  onLeave,
  className,
  showLeave = true,
  hostId,
}) {
  return (
    <GlassCard className={`p-4 ${className ?? ""}`}>
      <div className="flex justify-between items-center w-full">
        <h3 className="flex items-center gap-2 font-bold text-[var(--accent)] text-lg">
          <Users className="w-5 h-5" />
          Играчи
          <span className="font-normal">({players.length})</span>
        </h3>
        {showLeave && (
          <Button
            variant="destructive"
            size="icon"
            onClick={onLeave}
            aria-label="Leave room"
            className="p-2 rounded"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        )}
      </div>

      <ul className="flex flex-wrap gap-2 text-[var(--text)] text-sm">
        {players.map((player, idx) => {
          const isHost = hostId && player._id?.toString() === hostId.toString();

          return (
            <li
              key={player._id ?? idx}
              className={`px-3 py-1 rounded-full border-2 ${
                isHost
                  ? "border-[var(--accent)] bg-[var(--accent)]/20 font-semibold"
                  : "border-[var(--primary)] bg-[var(--background)]/60"
              }`}
            >
              {player.username || "Unknown"}
              {isHost}
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
