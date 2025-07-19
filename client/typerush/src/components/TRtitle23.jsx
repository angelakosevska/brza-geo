import React from "react";

export default function TRTitle23() {
  return (
    <div className="flex gap-8 mt-12">
      {/* TYPE Animation Block */}
      <div className="relative w-fit mx-auto">
        {/* Full Text */}
        <div className="absolute inset-0 animate-fadeOut z-0">
          <div className="flex gap-4 overflow-hidden h-[2.5rem]">
            <span className="text-6xl md:text-7xl font-black uppercase text-[var(--primary)] leading-none">
              TYPE
            </span>
          </div>
          <div className="flex gap-4 overflow-hidden h-[2.5rem]">
            <span className="text-6xl md:text-7xl font-black uppercase text-[var(--primary)] leading-none translate-y-[-2.5rem]">
              TYPE
            </span>
          </div>
        </div>

        {/* Split Animation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center animate-fadeIn z-10">
          <div className="flex overflow-hidden h-[2.5rem]">
            <span className="text-6xl md:text-7xl font-black uppercase text-[var(--primary)] leading-none">
              TYPE
            </span>
          </div>
          <div className="text-base md:text-xl font-semibold text-[var(--secondary)] mt-1">
            faster than them
          </div>
          <div className="flex overflow-hidden h-[2.5rem]">
            <span className="text-6xl md:text-7xl font-black uppercase text-[var(--primary)] leading-none translate-y-[-2.5rem]">
              TYPE
            </span>
          </div>
        </div>
      </div>

      {/* RUSH Animation Block */}
      <div className="relative w-fit mx-auto">
        {/* Full Text */}
        <div className="absolute inset-0 animate-fadeOut z-0">
          <div className="flex gap-4 overflow-hidden h-[2.5rem]">
            <span className="text-6xl md:text-7xl font-black uppercase text-[var(--primary)] leading-none">
              RUSH
            </span>
          </div>
          <div className="flex gap-4 overflow-hidden h-[2.5rem]">
            <span className="text-6xl md:text-7xl font-black uppercase text-[var(--primary)] leading-none translate-y-[-2.5rem]">
              RUSH
            </span>
          </div>
        </div>

        {/* Split Animation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center animate-fadeIn z-10">
          <div className="flex overflow-hidden h-[2.5rem]">
            <span className="text-6xl md:text-7xl font-black uppercase text-[var(--primary)] leading-none">
              RUSH
            </span>
          </div>
          <div className="text-base md:text-xl font-semibold text-[var(--secondary)] mt-1">
            against the clock
          </div>
          <div className="flex overflow-hidden h-[2.5rem]">
            <span className="text-6xl md:text-7xl font-black uppercase text-[var(--primary)] leading-none translate-y-[-2.5rem]">
              RUSH
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
