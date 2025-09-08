import { Outlet } from "react-router-dom";
import LetterBackground from "./components/global/LetterBackground";
import Header from "./components/global/Header";

export default function Layout2() {
  return (
    <LetterBackground>
      <div className="z-1 flex flex-col justify-center items-center gap-1 w-full min-h-screen">
        <Header />
        <div className="w-full max-w-[90vw] min-h-[80vh]">
          <Outlet />
        </div>
      </div>
    </LetterBackground>
  );
}
