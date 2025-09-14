import GlassCard from "@/components/global/GlassCard";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock } from "lucide-react";

export default function InvitationPage() {
  return (
    <div className="flex justify-center items-center p-6 min-h-screen text-text">
      <GlassCard className="space-y-6 p-8 w-full max-w-2xl text-center">
        {/* Title */}
        <h1 className="font-bold text-[var(--primary)] text-6xl">ПОКАНА</h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-lg">
          Со задоволство Ве поканувам на мојата одбрана на дипломската работа!
        </p>

        {/* Project title */}
        <div>
          <h2 className="font-semibold text-[var(--primary)] text-2xl">
            "Развој на веб-апликација (игра) во реално време со примена на MERN
            архитектура и Socket.IO "
          </h2>
        </div>

        {/* Details */}
        <div className="gap-6 grid md:grid-cols-3 text-left">
          <div className="flex flex-col items-center gap-2">
            <Calendar className="text-[var(--primary)]" />
            <span className="font-medium">Датум</span>
            <span className="text-muted-foreground">18.09.2025г.</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Clock className="text-[var(--primary)]" />
            <span className="font-medium">Време</span>
            <span className="text-muted-foreground">11:30h</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <MapPin className="text-[var(--primary)]" />
            <span className="font-medium">Локација</span>
            <span className="text-muted-foreground">ФИКТ</span>
          </div>
        </div>

        {/* Signature aligned right */}
        <div className="mt-6 text-muted-foreground text-right italic">
          Ваша{" "}
          <span className="font-semibold text-[var(--primary)]">Ангела</span>,
          Type Rush
        </div>
      </GlassCard>
    </div>
  );
}
