import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { InputCat } from "@/components/ui/inputCat";
import GlassCard from "./GlassCard";

export default function RoomSettingsForm({
  room,
  onUpdate,
  readOnly = false,
  className,
}) {
  const [rounds, setRounds] = useState(room.rounds);
  const [timer, setTimer] = useState(room.timer);

  useEffect(() => {
    console.log("RoomSettingsForm props changed!", {
      rounds: room.rounds,
      timer: room.timer,
    });

    setRounds(room.rounds);
    setTimer(room.timer);
  }, [room.rounds, room.timer]);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({ rounds, timer });
    }
  };

  return (
    <GlassCard className={className}>
      <div className="flex flex-col gap-6 p-4 w-full">
        <InputCat
          type="number"
          value={rounds}
          onChange={(e) => setRounds(Number(e.target.value))}
          label="Number of rounds"
          placeholder="Total number of rounds"
          min={1}
          disabled={readOnly}
          className="mb-2"
        />

        <InputCat
          type="number"
          value={timer}
          onChange={(e) => setTimer(Number(e.target.value))}
          label="Time per round (seconds)"
          placeholder="Time in seconds"
          min={60}
          className="mb-2"
          disabled={readOnly}
        />
        {!readOnly && (
          <Button variant="outline" onClick={handleSave}>
            Save Settings
          </Button>
        )}
        {!readOnly && <Button>Start Game</Button>}
      </div>
    </GlassCard>
  );
}
