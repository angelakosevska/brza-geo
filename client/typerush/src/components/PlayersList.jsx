import GlassCard from "@/components/GlassCard";
import { Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PlayersList({ players = [], onLeave, className }) {
  return (
    <GlassCard className={`p-4 ${className ?? ""}`}>
      <div className="flex justify-between items-center w-full">
        <h3 className="flex items-center gap-2 font-bold text-[var(--accent)] text-lg">
          <Users className="w-5 h-5" />
         Играчи
          <span className="font-normal">({players.length})</span>
        </h3>

        <Button
          variant="destructive"
          size="icon"
          onClick={onLeave}
          aria-label="Leave room"
          className="p-2 rounded"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      <ul className="flex flex-wrap gap-2 text-[var(--text)] text-sm">
        {players.map((player, idx) => (
          <li
            key={player._id ?? idx}
            className="bg-[var(--background)]/60 px-3 py-1 border border-[var(--primary)] rounded-full"
          >
            {player.username || "Unknown"}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
