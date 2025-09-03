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
  const [endMode, setEndMode] = useState(room.endMode || "ALL_SUBMIT");
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);

  // keep local state in sync with latest room from server
  useEffect(() => {
    setRounds(room.rounds);
    setTimer(room.timer);
    setEndMode(room.endMode || "ALL_SUBMIT");
  }, [room.rounds, room.timer, room.endMode]);

  const handleSave = async () => {
    if (!onUpdate) return;
    setSaving(true);
    try {
      await onUpdate({ rounds, timer, endMode });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveThenStart = async () => {
    if (readOnly || !onStart) return;
    setStarting(true);
    try {
      const changed =
        rounds !== room.rounds ||
        timer !== room.timer ||
        (endMode || "ALL_SUBMIT") !== (room.endMode || "ALL_SUBMIT");
      if (changed && onUpdate) {
        await onUpdate({ rounds, timer, endMode });
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
    (room.players?.length ?? 0) >= 1; // ако сакаш 2 играчи: >=2

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

        {/* Game Mode */}
        <div className="mb-2">
          <label className="block mb-2 font-medium text-[var(--primary)] text-sm">
            Начин на игра
          </label>
          <div className="gap-2 grid grid-cols-1 sm:grid-cols-2">
            <Button
              type="button"
              variant={endMode === "ALL_SUBMIT" ? "default" : "outline"}
              onClick={() => setEndMode("ALL_SUBMIT")}
              disabled={readOnly}
            >
              Стандарден
            </Button>
            <Button
              type="button"
              variant={endMode === "PLAYER_STOP" ? "default" : "outline"}
              onClick={() => setEndMode("PLAYER_STOP")}
              disabled={readOnly}
            >
              „Стоп“
            </Button>
          </div>
        </div>

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
