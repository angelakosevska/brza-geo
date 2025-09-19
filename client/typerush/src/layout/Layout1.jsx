import { Outlet } from "react-router-dom";
import LetterBackground from "@/components/global/LetterBackground";

//letter backgorund without any cards
//for auth pages where the cards vary in sizes
export default function Layout1() {
  return (
    <LetterBackground>
      <div className="z-1 flex flex-col justify-center items-center gap-1 w-full min-h-screen">
        <Outlet />
      </div>
    </LetterBackground>
  );
}
