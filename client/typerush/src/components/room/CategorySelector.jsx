import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/global/GlassCard";
import api from "@/lib/axios";

export default function CategorySelector({
  room,
  selected,
  onUpdate,
  readOnly = false,
  className,
}) {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(
    (selected || []).map((c) => (typeof c === "object" ? c._id : c)) // normalize to IDs
  );
  const [loading, setLoading] = useState(true);

  // Fetch all categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data } = await api.get("/categories");
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch (err) {
        console.error("❌ Failed to load categories:", err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  // Sync selection from props (normalize to IDs)
  useEffect(() => {
    setSelectedCategories(
      (selected || []).map((c) => (typeof c === "object" ? c._id : c))
    );
  }, [selected]);

  // Toggle category
  const toggleCategory = (catId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  // Save categories
  const handleSave = () => {
    if (onUpdate) onUpdate(selectedCategories);
  };

  // Split categories
  const defaultCategories = categories.filter((c) => c.isDefault);
  const playerCategories = categories.filter((c) => !c.isDefault);

  // Reusable render
  const renderCategoryList = (list) => (
    <div className="flex flex-wrap gap-2">
      {list.length === 0 && (
        <div className="text-[var(--glass)] text-sm italic">
          Нема категории.
        </div>
      )}
      {list.map((cat) => {
        const isSelected = selectedCategories.includes(cat._id);
        return (
          <button
            key={cat._id}
            type="button"
            className={`px-3 py-1.5 rounded-full border transition text-sm font-medium
              ${
                isSelected
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                  : "bg-transparent text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary)]/10"
              }
              ${readOnly ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
            `}
            onClick={() => !readOnly && toggleCategory(cat._id)}
            disabled={readOnly}
          >
            {cat.displayName?.mk || cat.name}
          </button>
        );
      })}
    </div>
  );

  return (
    <GlassCard className={className }>
      {loading ? (
        <div className="p-4 text-[var(--glass)] text-sm">Вчитување...</div>
      ) : (
        <div className="flex flex-col gap-6 p-4 h-full">
          {/* Default categories */}
          <div className="space-y-2">
            <p className="font-semibold text-[var(--primary)] text-sm uppercase tracking-wide">
              Основни категории
            </p>
            {renderCategoryList(defaultCategories)}
          </div>

          {/* Player categories */}
          <div className="space-y-2">
            <p className="font-semibold text-[var(--primary)] text-sm uppercase tracking-wide">
              Категории од играчи
            </p>
            {renderCategoryList(playerCategories)}
          </div>
        </div>
      )}

      {!readOnly && (
        <div className="p-4 border-[var(--glass)]/30 border-t">
          <Button
            onClick={handleSave}
            disabled={selectedCategories.length === 0}
            className="w-full"
          >
            Зачувај категории
          </Button>
        </div>
      )}
    </GlassCard>
  );
}
