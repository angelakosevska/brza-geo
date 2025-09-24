import GlassCard from "@/components/global/GlassCard";
import TRTitle from "@/components/TRTitle";
import { Calendar, MapPin, Clock } from "lucide-react";

export default function InvitationPage() {
  return (
    <div className="flex justify-center items-center min-h-screen text-text">
      <GlassCard className="w-full max-w-2xl text-center">
        {/* Logo at the very top */}
        <div className="flex justify-center">
          <img
            src="/tr2.svg"
            alt="Type Rush Logo"
            className="w-12 h-12 blink-cursor"
          />
        </div>

        {/* Title */}
        <h1 className="font-bold text-[var(--primary)] text-6xl">ПОКАНА</h1>

        {/* Subtitle */}
        <p className="text-[var(--text)] text-lg">
          Со задоволство Ве поканувам на мојата одбрана на дипломската работа!
        </p>

        {/* Project title */}
        <div className="flex flex-col justify-center items-center gap-2">
          <TRTitle />
          <h2 className="font-semibold text-[var(--primary)] text-2xl text-center">
            "Веб-базирана мултиплеер игра развиена со <br />
            MERN архитектура и Socket.io"
          </h2>
        </div>

        {/* Details */}
        <div className="gap-4 grid md:grid-cols-3 text-left">
          <div className="flex flex-col items-center gap-2">
            <Calendar className="text-[var(--primary)]" />
            <span className="font-medium text-[var(--text)]">Датум</span>
            <span className="text-[var(--text)]">xx.xx.2025г.</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Clock className="text-[var(--primary)]" />
            <span className="font-medium text-[var(--text)]">Време</span>
            <span className="text-[var(--text)]">xx:xxh</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <MapPin className="text-[var(--primary)]" />
            <span className="font-medium text-[var(--text)]">Локација</span>
            <span className="text-[var(--text)]">ФИКТ</span>
          </div>
        </div>

        {/* Signature aligned right */}
        <div className="mt-6 text-[var(--text)] text-right italic">
          Ваша{" "}
          <span className="font-semibold text-[var(--primary)]">Ангела</span>,
          Type Rush
        </div>
      </GlassCard>
    </div>
  );
}
