export default function TRTitleDemo() {
  return (
    <div className="relative w-full h-24 flex justify-center items-center">
      {/* Full Title - fades out */}
      <span className="absolute text-5xl font-black uppercase text-[var(--primary)] animate-fadeOut">
        TYPE RUSH
      </span>

      {/* Sentence - fades in */}
      <span className="absolute text-xl font-semibold text-[var(--secondary)] animate-fadeIn">
        faster than them • against the clock
      </span>
    </div>
  );
}
