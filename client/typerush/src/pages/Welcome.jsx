import LetterBackground from "../components/LetterBackground";
import GlassCard from "../components/GlassCard";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import TRTitle from "@/components/TRTitle";
import TRTitle2 from "@/components/TRtitle2";
import TRTitle23 from "@/components/TRtitle23";
import TRTitleDemo from "@/components/TRTitleDemo";
import { Route } from "react-router-dom";

export default function Welcome({ onStart }) {
  return (
    <>
      {/* Left side - Buttons */}
      <div className="md:w-1/2 flex flex-col justify-center items-center text-center">
        <CardFooter className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
          <h1 className="text-4xl text-[var(--primary)] drop-shadow-[1px_1px_0_rgba(0,0,0,0.3)]">
            Welcome to
          </h1>
          <TRTitle2 />
          <hr />
          <Button
            variant="outline"
            size="lg"
            onClick={onStart}
            className="w-full"
          >
            Start Playing as Guest
          </Button>

          <Button size="lg" className="w-full">
            Login or Register
          </Button>
        </CardFooter>
      </div>

      {/* Right side - Info */}
      <div className="md:w-1/2 p-6 flex items-center justify-center text-center text-[var(--text)] rounded-xl">
        <div>
          <h2 className="text-2xl font-semibold mb-4">How to Play</h2>
          <p className="text-base md:text-lg max-w-md mx-auto">
            This section will explain how the game is played with simple steps
            and visuals.
          </p>
        </div>
      </div>
    </>
  );
}
