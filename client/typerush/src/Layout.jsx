import { Outlet } from "react-router-dom";
import LetterBackground from "../src/components/LetterBackground";
import GlassCard from "./components/GlassCard";

export default function Layout() {
  return (
    <LetterBackground>
      <div className="w-full min-h-screen flex items-center justify-center">
        <GlassCard className="">
          <Outlet />
        </GlassCard>
      </div>
    </LetterBackground>
  );
}
