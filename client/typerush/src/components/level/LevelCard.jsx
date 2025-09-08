import { Progress } from "@/components/ui/progress";
import GlassCard from "@/components/global/GlassCard";
import { useAuth } from "@/context/AuthContext";

export default function LevelCard({ username, level, currentWP }) {
  // секој левел бара 100 WP
  const wpForNextLevel = 100;
  const currentLevelWP = currentWP % wpForNextLevel;
  const progress = (currentLevelWP / wpForNextLevel) * 100;
  const { user } = useAuth();
  return (
    <GlassCard className="flex flex-col items-start gap-3 p-4">
      {/* Header: badge + username */}
      <div className="flex items-center gap-4">
        <div
          className="flex justify-center items-center rounded-full w-16 h-16 font-bold text-[#ebfaf6] text-2xl blink-cursor"
          style={{
            backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000'><path d='m814.1 159.6.9-2.1c-112.4 43.1-209.4 21-300.6-57.6L500 87.5l-14.4 12.4c-91.2 78.6-188.2 100.7-300.6 57.6 52.8 125.4-2.8 215.4-46.8 343.2-12.5 36.4-11.3 96.2 4.8 131 70.6 153 354.6 270.8 354.6 270.8s287.8-115 359-269.2c16-34.9 17.4-94.7 5-131-43.7-127.5-99.8-217.8-47.5-342.7Z' fill='%23${encodeURIComponent(
              getComputedStyle(document.documentElement)
                .getPropertyValue("--primary")
                .trim()
                .replace("#", "")
            )}'></path></svg>")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {level}
        </div>
        <span className="font-semibold text-[var(--text)] text-lg">
          {user?.username}
        </span>
      </div>

      {/* WP info */}
      <p className="text-[var(--glass)] text-sm">
        Word Power: {currentLevelWP} / {wpForNextLevel * level}
      </p>

      {/* Progress bar */}
      <Progress value={progress} className="w-full h-3" />
    </GlassCard>
  );
}
