import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ALL_CATEGORIES } from "@/lib/ALL_CATEGORIES";
import { socket } from "@/lib/socket";
import GlassCard from "./GlassCard";

export default function CategorySelector({
  room,
  selected,
  onUpdate,
  readOnly = false,
  className,
}) {
  const [selectedCategories, setSelectedCategories] = useState(selected || []);

  useEffect(() => {
    setSelectedCategories(selected || []);
  }, [selected]);

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = () => {
    socket.emit("updateRoomSettings", {
      roomCode: room.code,
      rounds: room.rounds,
      timer: room.timer,
      categories: selectedCategories,
    });
    if (onUpdate) onUpdate(selectedCategories);
    alert("Categories saved!");
  };

  return (
    <>
      <GlassCard className={className}>
        <h4 className="p-4font-bold text-[var(--primary)]">Categories</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {ALL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategories.includes(cat);

            return (
              <button
                key={cat}
                type="button"
                className={`px-4 py-2 rounded-full border transition
                ${
                  isSelected
                    ? "bg-[var(--primary)] text-white"
                    : "bg-transparent text-[var(--primary)] border-[var(--primary)]"
                }
                ${readOnly ? "opacity-60 cursor-not-allowed" : ""}
              `}
                onClick={() => !readOnly && toggleCategory(cat)}
                disabled={readOnly}
                tabIndex={readOnly ? -1 : 0}
              >
                {cat}
              </button>
            );
          })}
        </div>
        {!readOnly && (
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={selectedCategories.length === 0}
          >
            Save Categories
          </Button>
        )}
      </GlassCard>
    </>
  );
}
