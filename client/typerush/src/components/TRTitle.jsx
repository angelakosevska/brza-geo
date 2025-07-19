export default function TRTitle() {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-1 mt-8">
      {/* Top halves */}
      <div className="flex gap-8">
        <div className="overflow-hidden h-[2rem]">
          <span className="block text-6xl md:text-7xl uppercase font-black text-[var(--accent)] leading-none">
            TYPE
          </span>
        </div>
        <div className="overflow-hidden h-[2rem]">
          <span className="block text-6xl md:text-7xl uppercase font-black text-[var(--secondary)] leading-none">
            RUSH
          </span>
        </div>
      </div>

      {/* Middle sentence */}
      <div className="flex gap-12 text-[var(--text)] font-bold text-lg md:text-xl ">
        <span>faster than them</span>
        <span>against the clock</span>
      </div>

      {/* Bottom halves */}
      <div className="flex gap-8">
        <div className="overflow-hidden h-[2.5rem]">
          <span className="block text-6xl md:text-7xl uppercase font-black text-[var(--accent)] leading-none translate-y-[-2.5rem]">
            TYPE
          </span>
        </div>
        <div className="overflow-hidden h-[2.5rem]">
          <span className="block text-6xl md:text-7xl uppercase font-black text-[var(--secondary)] leading-none translate-y-[-2.5rem]">
            RUSH
          </span>
        </div>
      </div>
    </div>
  );
}
