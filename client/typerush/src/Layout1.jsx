import { Outlet } from "react-router-dom";
import LetterBackground from "./components/LetterBackground";

export default function Layout1() {
  return (
    <LetterBackground>
      <div className="w-full min-h-screen flex z-1 items-center justify-center">
        <Outlet />
      </div>
    </LetterBackground>
  );
}
