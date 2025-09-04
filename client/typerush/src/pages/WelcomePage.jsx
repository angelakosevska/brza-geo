import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import TRTitle from "@/components/TRTitle";
import { useNavigate } from "react-router-dom";
import HowToPlay from "@/components/HowToPlay";

export default function Welcome() {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const navigate = useNavigate();

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex md:flex-row flex-col w-full min-h-[80vh]">
      {/* Лева страна */}
      <div className="flex justify-center items-center p-6 w-full md:w-1/2">
        <div className="flex flex-col items-center gap-6 w-full max-w-[50vh] text-center">
          {/* Лого секогаш видливо */}
          <img
            src="/tr2.svg"
            alt="Type Rush Logo"
            className="mx-auto w-24 h-24 blink-cursor"
          />

          <CardFooter className="flex flex-col items-center gap-6 w-full">
            <h1 className="text-[var(--primary)] text-4xl">Welcome to</h1>
            <TRTitle />
            <hr />
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              Најави се или Регистрирај се
            </Button>

            {/* На мобилен toggle копче */}
            {!isDesktop && (
              <Button
                variant="link"
                className="md:hidden"
                onClick={() => setShowHowToPlay((prev) => !prev)}
              >
                {showHowToPlay ? "Скриј инструкции" : "Како да играш"}
              </Button>
            )}
          </CardFooter>
        </div>
      </div>

      {/* Десна страна → default open на desktop */}
      {(isDesktop || showHowToPlay) && (
        <div className="flex justify-center items-center p-6 w-full md:w-1/2 text-[var(--text)] text-center">
          <div className="w-full">
            <HowToPlay columns={isDesktop ? 2 : 1} />
          </div>
        </div>
      )}
    </div>
  );
}
