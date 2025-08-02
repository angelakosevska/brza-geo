import { Outlet } from "react-router-dom";
import LetterBackground from "./components/LetterBackground";
import Header from "./components/Header";

export default function Layout2() {
  return (
    <LetterBackground>
      <div className="w-full min-h-screen flex flex-col gap-1 z-1 items-center justify-center">
        <Header />
        <div className="w-full max-w-[90vw] min-h-[80vh]">
          <Outlet />
        </div>
      </div>
    </LetterBackground>
  );
}
