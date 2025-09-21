import { useEffect, useRef } from "react";
import GlassCard from "@/components/global/GlassCard";

export default function SelectedCategoriesPanel({
  categories = [],
  className,
}) {
  const listRef = useRef(null);

  // Auto scroll to bottom when categories update
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [categories]);

  if (!categories.length) {
    return (
      <GlassCard className="lg:w-1/4 text-[var(--glass)] text-sm text-center italic">
        Нема селектирани категории.
      </GlassCard>
    );
  }

  return (
    <GlassCard className={`${className} flex flex-col gap-4 p-6`}>
      {/* Header with badge */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-[var(--primary)] text-lg">
          Избрани категории
        </h3>
        <span className="bg-[var(--primary)]/20 px-2 py-1 rounded-full font-medium text-[var(--primary)] text-xs">
          {categories.length}
        </span>
      </div>

      {/* List of categories */}
      <ul ref={listRef} className="space-y-3 pr-1 max-h-80 overflow-y-auto">
        {categories.map((cat) => (
          <li
            key={cat._id || cat.name}
            className="bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 shadow-sm p-3 rounded-xl transition"
          >
            <div className="flex flex-col">
              {/* Name */}
              <p className="font-semibold text-[var(--text)] text-sm">
                {cat.name}
              </p>

              {/* Description */}
              {cat.description ? (
                <p className="mt-1 text-[var(--text)]/70 text-xs leading-snug">
                  {cat.description}
                </p>
              ) : (
                <p className="mt-1 text-[var(--text)]/40 text-xs italic">
                  Нема опис
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
