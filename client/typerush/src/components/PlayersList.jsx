import GlassCard from "@/components/global/GlassCard";
import { Users, LogOut, Crown } from "lucide-react";
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
      {/* Header */}
      <div className="flex justify-between items-center mb-3 w-full">
        <h3 className="flex items-center gap-2 font-bold text-[var(--primary)] text-lg">
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
            title="Напушти соба"
            className="p-2 rounded-full"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Players list */}
      <ul className="flex sm:flex-row flex-col sm:flex-wrap gap-2 text-[var(--text)] text-sm">
        {players.map((player, idx) => {
          const isHost = hostId && player._id?.toString() === hostId.toString();

          return (
            <li
              key={player._id ?? idx}
              className={`flex items-center gap-1 px-3 py-1 rounded-full border-2 transition-all ${
                isHost
                  ? "border-[var(--secondary)] bg-[var(--secondary)]/20 font-semibold shadow-[0_0_5px_var(--secondary)] "
                  : "border-[var(--primary)] bg-[var(--primary)]/20"
              }`}
            >
              {player.username || "Unknown"}
              {isHost && (
                <Crown className="drop-shadow-[0_0_1px_var(--secondary)] w-4 h-4 text-[var(--secondary)]" />
              )}
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
