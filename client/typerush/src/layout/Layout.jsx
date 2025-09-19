import { Outlet } from "react-router-dom";
import LetterBackground from "@/components/global/LetterBackground";
import GlassCard from "@/components/global/GlassCard";

//letter background with one big glass card layout
export default function Layout() {
  return (
    <LetterBackground>
      <div className="flex justify-center items-center w-full min-h-screen">
        <GlassCard className="w-[90vw]">
          <Outlet />
        </GlassCard>
      </div>
    </LetterBackground>
  );
}
