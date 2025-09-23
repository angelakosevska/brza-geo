import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import GlassCard from "../global/GlassCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      <div className="flex flex-col gap-6 p-4 w-full h-full">
        {/* Select Rounds */}
        <div>
          <label className="block mb-2 font-medium text-[var(--primary)] text-sm">
            Број на рунди
          </label>
          <Select
            value={String(rounds)}
            onValueChange={(val) => setRounds(Number(val))}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Избери рунди" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 25 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)} className="hover:bg-[var(--secondary)]/20 hover:text-[var(--secondary)]">
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Select Timer */}
        <div>
          <label className="block mb-2 font-medium text-[var(--primary)] text-sm">
            Време за рунда
          </label>
          <Select
            value={String(timer)}
            onValueChange={(val) => setTimer(Number(val))}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Избери време" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 18 }, (_, i) => {
                const value = (i + 1) * 10; // 10, 20, ..., 180
                return (
                  <SelectItem key={value} value={String(value)} className="hover:bg-[var(--secondary)]/20 hover:text-[var(--secondary)]">
                    {value} сек.
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

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
              variant="secondary"
              onClick={handleSaveThenStart}
              disabled={!canStart || starting || saving}
              title={
                canStart
                  ? "Започни ја играта"
                  : "Избери категории и додај играчи или играта веќе започнала"
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
