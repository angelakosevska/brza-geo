import { Outlet } from "react-router-dom";
import LetterBackground from "@/components/global/LetterBackground";
import Header from "@/components/global/Header";
import Footer from "@/components/global/Footer";

export default function Layout2() {
  return (
    <LetterBackground>
      <div className="flex flex-col mx-auto min-h-screen ">
        {/* Centered header */}
        <div className="flex flex-col mx-auto w-full  sm:max-w-[90vw]  lg:max-w-[70vw]">
          <Header />
        </div>
        {/* Main content matches header width */}
        <main className="flex flex-1 mx-auto my-1 w-full sm:max-w-[90vw] lg:max-w-[70vw]">
          <Outlet />
        </main>

        <div className="mx-auto mb-1 w-full sm:max-w-[90vw] lg:max-w-[70vw]">
          <Footer />
        </div>
      </div>
    </LetterBackground>
  );
}
