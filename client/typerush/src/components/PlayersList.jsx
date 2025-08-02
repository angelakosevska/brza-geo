import { useState } from "react";
import GlassCard from "@/components/GlassCard";
import { ChevronDown, ChevronUp, Users } from "lucide-react";

const mockPlayers = [
  { username: "Alice" },
  { username: "Bob" },
  { username: "Charlie" },
  { username: "DahliaTheCoder" },
  { username: "Eve" },
  { username: "Frank" },
  { username: "Grace" },
  { username: "Heidi" },
  { username: "Ivan" },
  { username: "Judy" },
  { username: "Mallory" },
  { username: "Oscar" },
];

export default function PlayersList({ players, className }) {
  const [expanded, setExpanded] = useState(false);

  // Merge real players with mock players (for dev only)
  const mergedPlayers = [...(players || []), ...mockPlayers];

  // Collapse if more than 4 players
  const COLLAPSE_LIMIT = 4;
  const shouldCollapse = mergedPlayers.length > COLLAPSE_LIMIT;

  // Show toggle if we should be able to collapse
  const showCollapseToggle = shouldCollapse;

  // Number of players to show when collapsed
  const COLLAPSED_SHOW = 4;

  return (
    <GlassCard className={`p-4 ${className ?? ""}`}>
      {/* Header */}
      <div className="flex justify-between items-center w-full">
        <h3 className="flex items-center gap-2 font-bold text-[var(--accent)] text-lg">
          <Users className="w-5 h-5" />
          Players
          <span className="ml-2 font-normal">({mergedPlayers.length})</span>
        </h3>
        {showCollapseToggle && (
          <button
            className="ml-2 p-1 text-[var(--accent)]"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? "Collapse list" : "Expand list"}
          >
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </button>
        )}
      </div>
      {/* Players list */}
      <ul className="flex flex-wrap gap-2 mt-2 text-[var(--text)] text-sm">
        {(shouldCollapse && !expanded
          ? mergedPlayers.slice(0, COLLAPSED_SHOW)
          : mergedPlayers
        ).map((player, idx) => (
          <li
            key={idx}
            className="bg-[var(--background)]/60 px-3 py-1 border border-[var(--primary)] rounded-full"
          >
            {player.username || "Unknown"}
          </li>
        ))}
        {/* Show +N more if collapsed */}
        {shouldCollapse && !expanded && mergedPlayers.length > COLLAPSED_SHOW && (
          <li
            className="px-2 py-1 text-[var(--accent)] text-xs cursor-pointer"
            onClick={() => setExpanded(true)}
          >
            +{mergedPlayers.length - COLLAPSED_SHOW} more
          </li>
        )}
      </ul>
    </GlassCard>
  );
}
