import GlassCard from "@/components/GlassCard";
import Header from "@/components/Header";
import PlayersList from "@/components/PlayersList";
import RoundInfoCard from "@/components/game/RoundInfoCard";

export default function TestPage() {
  return (
    <>
      <Header />
      <PlayersList
        players={room.players}
        showLeave={false}
        className="w-full lg:w-3/4"
      />
      <RoundInfoCard />
    </>
  );
}
