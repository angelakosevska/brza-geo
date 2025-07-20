import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import TRTitle from "@/components/TRTitle";

export default function Welcome({ onStart }) {
  return (
    <div className="flex flex-col md:flex-row w-full min-h-[80vh]">
      {/* Left side: Welcome, Title, Buttons */}
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center text-center p-8">
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
          <Button size="lg" className="w-full">
            Login or Register
          </Button>
        </CardFooter>
      </div>

      {/* Right side: How to Play info */}
      <div className="md:w-1/2 w-full p-6 flex items-center justify-center text-center text-[var(--text)] rounded-xl">
        <div>
          <img
            src="/tr.svg"
            alt="Type Rush Logo"
            className="w-24 h-24 mx-auto mb-4 blink-cursor"
          />
          <h2 className="text-2xl font-semibold mb-4">How to Play</h2>
          <p className="text-base md:text-lg max-w-md mx-auto">
            This section will explain how the game is played with simple steps
            and visuals.
          </p>
        </div>
      </div>
    </div>
  );
}
