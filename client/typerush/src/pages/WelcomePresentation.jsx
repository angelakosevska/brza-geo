import GlassCard from "@/components/global/GlassCard";
import TRTitle from "@/components/TRTitle";

export default function WelcomePresentation() {
  return (
    <div className="flex justify-center items-center min-h-screen text-text">
      <GlassCard className="flex flex-col items-center gap-8 p-10 w-full max-w-2xl text-center">
        {/* Logo */}
        <img
          src="/tr2.svg"
          alt="Type Rush Logo"
          className="w-16 h-16 blink-cursor"
        />

        {/* Game Title */}
        <TRTitle className="text-5xl sm:text-6xl" />

        {/* Welcome Message */}
        <h1 className="font-extrabold text-[var(--primary)] text-4xl sm:text-5xl uppercase tracking-wider">
          ДОБРЕДОЈДОВТЕ
        </h1>
      </GlassCard>
    </div>
  );
}
