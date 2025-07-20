import React from "react";

export default function TRTitle2() {
  return (
    <>
      <div className="flex gap-8">
        <div className="relative group w-fit mx-auto cursor-pointer">
          {/* Full Text */}
          <div className="transition-opacity duration-300 group-hover:opacity-0">
            <div className="flex flex-col md:flex-row sm:flex-row md:gap-1 gap-4 overflow-hidden h-[2.5rem]">
              <span className="text-6xl font-black uppercase text-[var(--primary)] leading-none">
                TYPE
              </span>
            </div>

            {/* Bottom half (shifted down visually) */}
            <div className="flex gap-4 overflow-hidden h-[2.5rem] flex-col md:flex-row sm:flex-row md:gap-1">
              <span className="text-6xl font-black uppercase text-[var(--primary)] leading-none translate-y-[-2.5rem]">
                TYPE
              </span>
            </div>
          </div>

          {/* Split Animation */}
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* Top half */}
            <div className="flex overflow-hidden h-[2.5rem] flex-col md:flex-row sm:flex-row md:gap-1">
              <span className="text-6xl font-black uppercase text-[var(--primary)] leading-none">
                TYPE
              </span>
            </div>

            {/* Middle text */}
            <div className="flex gap-2 text-md font-semibold text-[var(--secondary)]">
              <span>faster than them</span>
            </div>

            {/* Bottom half (shifted down visually) */}
            <div className="flex gap-4 overflow-hidden h-[2.5rem] flex-col md:flex-row sm:flex-row md:gap-1">
              <span className="text-6xl font-black uppercase text-[var(--primary)] leading-none translate-y-[-2.5rem]">
                TYPE
              </span>
            </div>
          </div>
        </div>
        <div className="relative group w-fit mx-auto cursor-pointer">
          {/* Full Text */}
          <div className="transition-opacity duration-300 group-hover:opacity-0">
            <div className="flex gap-4 overflow-hidden h-[2.5rem]">
              <span className="text-6xl font-black uppercase text-[var(--primary)] leading-none">
                RUSH
              </span>
            </div>

            {/* Bottom half (shifted down visually) */}
            <div className="flex gap-4 overflow-hidden h-[2.5rem]">
              <span className="text-6xl font-black uppercase text-[var(--primary)] leading-none translate-y-[-2.5rem]">
                RUSH
              </span>
            </div>
          </div>

          {/* Split Animation */}
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* Top half */}
            <div className="flex gap-4 overflow-hidden h-[2.5rem]">
              <span className="text-6xl font-black uppercase text-[var(--primary)] leading-none">
                RUSH
              </span>
            </div>

            {/* Middle text */}
            <div className="flex gap-6 text-md  font-semibold text-[var(--secondary)]">
              <span>against the clock</span>
            </div>

            {/* Bottom half (shifted down visually) */}
            <div className="flex gap-4 overflow-hidden h-[2.5rem]">
              <span className="text-6xl font-black uppercase text-[var(--primary)] leading-none translate-y-[-2.5rem]">
                RUSH
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
