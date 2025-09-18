import React from "react";
import TRTitle2 from "./TRTitle2"; // Adjust path if needed

export default function TRTitle() {
  return (
    <>
      {/* Animated TRTitle2 on desktop and larger */}
      <div className="hidden md:flex">
        <TRTitle2 />
      </div>

      {/* Simple stacked version for mobile and tablets */}
      <div className="md:hidden flex flex-col items-center gap-1">
        <span className="font-black text-[var(--primary)] text-3xl sm:text-4xl uppercase leading-none">
          TYPE
        </span>

        <span className="font-black text-[var(--primary)] text-3xl sm:text-4xl uppercase leading-none">
          RUSH
        </span>
      </div>
    </>
  );
}
