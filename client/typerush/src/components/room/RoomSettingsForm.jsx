import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { InputCat } from "@/components/ui/inputCat";
import GlassCard from "../GlassCard";

export default function RoomSettingsForm({
  room,
  onUpdate,
  onStart,
  readOnly = false,
  className,
}) {
  const [rounds, setRounds] = useState(room.rounds);
  const [timer, setTimer] = useState(room.timer);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    setRounds(room.rounds);
    setTimer(room.timer);
  }, [room.rounds, room.timer]);

  const handleSave = async () => {
    if (!onUpdate) return;
    setSaving(true);
    try {
      await onUpdate({ rounds, timer });
    } finally {
      setSaving(false);
    }
  };

  // Save (if needed) → then Start
  const handleSaveThenStart = async () => {
    if (readOnly || !onStart) return;
    setStarting(true);
    try {
      const changed = rounds !== room.rounds || timer !== room.timer;
      if (changed && onUpdate) {
        await onUpdate({ rounds, timer });
      }
      await onStart();
    } finally {
      setStarting(false);
    }
  };

  const canStart =
    !readOnly &&
    !room.started &&
    (room.categories?.length ?? 0) > 0 &&
    (room.players?.length ?? 0) >= 2; // change to >=2 if you require 2 players

  return (
    <GlassCard className={className}>
      <div className="flex flex-col gap-6 p-4 w-full">
        <InputCat
          type="number"
          value={rounds}
          onChange={(e) => setRounds(Math.max(1, Number(e.target.value)))}
          label="Број на рунди"
          placeholder="Total number of rounds"
          min={1}
          disabled={readOnly}
          className="mb-2"
        />

        <InputCat
          type="number"
          value={timer}
          onChange={(e) => setTimer(Math.max(10, Number(e.target.value)))}
          label="Време за рунда (секунди)"
          placeholder="Time in seconds"
          min={10}
          className="mb-2"
          disabled={readOnly}
        />

        {!readOnly && (
          <div className="flex lg:flex-col gap-4">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={saving}
              title="Save settings"
            >
              {saving ? "Се зачувува…" : "Зачувај"}
            </Button>

            <Button
              onClick={handleSaveThenStart}
              disabled={!canStart || starting || saving}
              title={
                canStart
                  ? "Start the game"
                  : "Add categories and players, or game already started"
              }
            >
              {starting
                ? "Започнува…"
                : room.started
                ? "Во тек..."
                : "Започни ја играта!"}
            </Button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
