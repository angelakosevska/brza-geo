import { Outlet } from "react-router-dom";
import LetterBackground from "./components/global/LetterBackground";
import Header from "./components/global/Header";

export default function Layout2() {
  return (
    <LetterBackground>
      <div className="flex flex-col min-h-screen">
        {/* Centered header */}
        <div className="mx-auto w-full max-w-[90vw]">
          <Header />
        </div>

        {/* Main content matches header width */}
        <main className="flex-1 mx-auto my-1 w-full max-w-[90vw]">
          <Outlet />
        </main>
      </div>
    </LetterBackground>
  );
}
