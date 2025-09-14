import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import TRTitle from "@/components/TRTitle";
import { useNavigate } from "react-router-dom";
import HowToPlay from "@/components/HowToPlay";

// Главна Welcome компонента – ова е првата страница што ја гледа корисникот
export default function Welcome() {
  // state за toggle на секцијата "Како да играш" на мобилен
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // state за да знаеме дали viewport е desktop или mobile
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // hook од react-router за програмска навигација
  const navigate = useNavigate();

  // useEffect за да слуша resize и автоматски да update-ира дали сме на desktop
  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    window.addEventListener("resize", handleResize);

    // cleanup кога компонентата ќе се уништи 
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex md:flex-row flex-col w-full min-h-[80vh]">
      {/* Лева страна – логото, насловот и копчињата */}
      <div className="flex justify-center items-center p-6 w-full md:w-1/2">
        <div className="flex flex-col items-center gap-6 w-full max-w-[50vh] text-center">
          {/* Лого */}
          <img
            src="/tr2.svg"
            alt="Type Rush Logo"
            className="mx-auto w-24 h-24 blink-cursor"
          />

          <CardFooter className="flex flex-col items-center gap-6 w-full">
            <h1 className="text-[var(--primary)] text-4xl">Добредојде во</h1>
            {/* TRTitle е custom компонентата со стилизираното име на играта */}
            <TRTitle />
            <hr />

            {/* Копче за навигација кон логин/регистрација */}
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              Најави се или Регистрирај се
            </Button>

            {/* На мобилен имаме toggle копче за инструкции */}
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

      {/* Десна страна – секцијата со инструкции */}
      {/* На desktop секогаш се гледа, на мобилен само ако е отворено */}
      {(isDesktop || showHowToPlay) && (
        <div className="flex justify-center items-center p-6 w-full md:w-1/2 text-[var(--text)] text-center">
          <div className="w-full">
            {/* HowToPlay е компонентата со објаснувања за правилата */}
            <HowToPlay columns={isDesktop ? 2 : 1} />
          </div>
        </div>
      )}
    </div>
  );
}
