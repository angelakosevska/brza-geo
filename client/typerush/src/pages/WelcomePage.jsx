import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import TRTitle from "@/components/TRTitle";
import { useNavigate } from "react-router-dom";
import HowToPlay from "@/components/HowToPlay";
import InfoAccordion from "@/components/InfoAccordion";

// Main Welcome component – this is the first screen users see
export default function Welcome() {
  // Toggle state for "How to play" section on mobile
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // State to check if viewport is desktop size (>=768px)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Hook for programmatic navigation
  const navigate = useNavigate();

  // Listen to window resize and update isDesktop accordingly
  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    window.addEventListener("resize", handleResize);

    // Cleanup listener on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex md:flex-row flex-col w-full min-h-[80vh]">
      {/* Left side – logo, title, and buttons */}
      <div className="flex justify-center items-center my-auto p-6 w-full md:w-1/2 align-center">
        <div className="flex flex-col items-center gap-6 max-w-[50vh] text-center nw-full align-center">
          {/* Logo */}
          <img
            src="/tr2.svg"
            alt="Type Rush Logo"
            className="mx-auto w-24 h-24 blink-cursor"
          />

          <CardFooter className="flex flex-col items-center gap-6 w-full">
            <h1 className="text-[var(--primary)] text-4xl">Добре дојде во</h1>
            {/* TRTitle is a custom styled component for the game name */}
            <TRTitle />
            <hr />

            {/* Button to go to login/register */}
            <Button
              size="lg"
              className="sm:w-[80vw] lg:w-[30vw]"
              onClick={() => navigate("/auth")}
            >
              Најави се или регистрирај се
            </Button>

            {/* On mobile: toggle button for instructions */}
            {!isDesktop && (
              <Button
                variant="link"
                className="md:hidden"
                onClick={() => setShowHowToPlay((prev) => !prev)}
              >
                {showHowToPlay ? "Затвори" : "Како да играш"}
              </Button>
            )}
          </CardFooter>
        </div>
      </div>

      {/* Right side – instructions */}
      {/* Always visible on desktop, toggled on mobile */}
      {(isDesktop || showHowToPlay) && (
        <div className="flex justify-center items-center p-6 w-full md:w-1/2 text-[var(--text)] text-center">
          <div className="w-full">
            {/* HowToPlay is the component with the rules */}
            <HowToPlay columns={isDesktop ? 2 : 1} />
          </div>
        </div>
      )}
    </div>
  );
}
