import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import TRTitle from "@/components/TRTitle";
import { useNavigate } from "react-router-dom";

export default function Welcome({ onStart }) {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col  md:flex-row w-full h-full  align-middle justify-center">
      {/* Left side (mobile = top half): Logo + Content */}
      <div className="w-full h-full md:w-1/2 flex flex-col items-center justify-center text-center p-6 gap-6">
        {/* Logo on top (visible only on small screens) */}
        <img
          src="/tr2.svg"
          alt="Type Rush Logo"
          className="w-24 h-24 md:hidden mx-auto blink-cursor"
        />

        <CardFooter className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
          <h1 className="text-4xl text-[var(--primary)]">Welcome to</h1>
          <TRTitle />
          <hr />
          <Button
            variant="outline"
            size="lg"
            onClick={onStart}
            className="w-full"
          >
            Start Playing as Guest
          </Button>
          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate("/auth")}
          >
            Login or Register
          </Button>

          {/* Toggle button for How to Play (on small screens only) */}
          <Button
            variant="ghost"
            className="md:hidden"
            onClick={() => setShowHowToPlay(!showHowToPlay)}
          >
            {showHowToPlay ? "Hide Instructions" : "How to Play"}
          </Button>
        </CardFooter>
      </div>

      {/* Right side: How to Play (always shown on desktop, collapsible on mobile) */}
      {(showHowToPlay || window.innerWidth >= 768) && (
        <div className="w-full md:w-1/2 p-6 flex items-center justify-center text-center text-[var(--text)] rounded-xl">
          <div>
            {/* Show logo only on desktop */}
            <img
              src="/tr2.svg"
              alt="Type Rush Logo"
              className="w-24 h-24 hidden md:block mx-auto mb-4 blink-cursor"
            />
            <h2 className="text-2xl font-semibold mb-4">How to Play</h2>
            <p className="text-base md:text-lg max-w-md mx-auto">
              This section will explain how the game is played with simple steps
              and visuals.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
