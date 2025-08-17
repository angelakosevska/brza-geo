import React from "react";
import  TRTitle2  from "@/components/TRtitle2"; // Adjust path if needed

export default function TRTitle() {
  return (
    <>
      {/* Animated TRTitle2 on desktop and larger */}
      <div className="hidden md:flex">
        <TRTitle2 />
      </div>

      {/* Simple stacked version for mobile and tablets */}
      <div className="flex flex-col md:hidden items-center gap-1">
        <span className="text-3xl sm:text-4xl font-black uppercase text-[var(--primary)] leading-none">
          TYPE
        </span>

        <span className="text-3xl sm:text-4xl font-black uppercase text-[var(--primary)] leading-none">
          RUSH
        </span>
      </div>
    </>
  );
}
