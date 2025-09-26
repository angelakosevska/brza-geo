import { Progress } from "@/components/ui/progress";
import GlassCard from "@/components/global/GlassCard";
import { useAuth } from "@/context/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function LevelCard({
  level,
  wordPower,
  wpForNextLevel,
  currentLevelWP,
  progressPercent,
}) {
  const { user } = useAuth();

  return (
    <GlassCard className="flex flex-col gap-4 p-5">
      {/* Header: Level badge + username */}
      <div className="flex items-center gap-4">
        {/* Level badge со SVG (оригиналниот) */}
        <div
          className="flex justify-center items-center rounded-full w-16 h-16 font-bold text-[#ebfaf6] text-2xl"
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

        {/* Username */}
        <span className="font-semibold text-[var(--text)] text-lg truncate">
          {user?.username}
        </span>
      </div>

      {/* WP info */}
      <div className="flex flex-col w-full">
        <div className="flex justify-end mb-1 text-[var(--text)] text-xs sm:text-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">
                  {currentLevelWP} / {wpForNextLevel} WP
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Word Power освоени на ова ниво. Наполни ја лентата за да
                преминеш на следно ниво.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Progress bar со градиент fill */}
        <Progress
          value={progressPercent}
          className="[&>div]:bg-gradient-to-r [&>div]:from-[#25b790] [&>div]:via-[#9e4dd4] [&>div]:to-[#ff7e6b] w-full h-3"
        />

        <div className="flex justify-start mt-1 text-[var(--text)] text-xs sm:text-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">Вкупно: {wordPower} WP</span>
              </TooltipTrigger>
              <TooltipContent >
                Вкупно Word Power од сите нивоа.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </GlassCard>
  );
}
