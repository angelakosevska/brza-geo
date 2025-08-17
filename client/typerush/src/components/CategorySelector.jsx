import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { socket } from "@/lib/socket";
import GlassCard from "./GlassCard";
import api from "@/lib/axios";


export default function CategorySelector({
  room, // Room object (must have .code and .categories)
  selected, // Array of currently selected category IDs (from parent/room)
  onUpdate, // Callback to parent if needed
  readOnly = false, // If true, disables interaction (for non-hosts)
  className, // Optional additional classes for styling
}) {
  // List of all categories fetched from the server
  const [categories, setCategories] = useState([]);
  // Which categories are currently selected (local state, synced from props & sockets)
  const [selectedCategories, setSelectedCategories] = useState(selected || []);
  // Loading state for fetch
  const [loading, setLoading] = useState(true);

  // Fetch all categories from backend on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data } = await api.get("/categories");
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch (err) {
        setCategories([]);
        console.error("Failed to load categories:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);
  // When parent changes 'selected', update local selection
  useEffect(() => {
    setSelectedCategories(selected || []);
  }, [selected]);

  // Allow the host to toggle selection of a category
  const toggleCategory = (catId) => {
    setSelectedCategories(
      (prev) =>
        prev.includes(catId)
          ? prev.filter((c) => c !== catId) // Remove if already selected
          : [...prev, catId] // Add if not selected
    );
  };
  const handleSave = () => {
    console.log("Emitting setCategories:", selectedCategories);
    socket.emit("setCategories", {
      code: room.code,
      categories: selectedCategories,
    });
    if (onUpdate) onUpdate(selectedCategories);
  };

  useEffect(() => {
    const handleCategoriesSet = ({ categories }) => {
      console.log("Received categoriesSet:", categories);
      setSelectedCategories(categories);
    };
    socket.on("categoriesSet", handleCategoriesSet);
    return () => {
      socket.off("categoriesSet", handleCategoriesSet);
    };
  }, []);
  return (
    <GlassCard className={className}>
      {/* Title */}
      <h4 className="p-4 font-bold text-[var(--primary)]">Категории</h4>
      {loading ? (
        // Loading indicator
        <div className="p-4 text-gray-400 text-sm">Вчитување...</div>
      ) : (
        // List of all available categories as buttons
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.length === 0 && (
            <div className="text-muted-foreground">
              Нема пронајдено категории.
            </div>
          )}
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              // Styling for selected/unselected/readOnly states
              className={`px-4 py-2 rounded-full border-2 transition
                ${
                  selectedCategories.includes(cat._id)
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "bg-transparent text-[var(--primary)] border-[var(--primary)]"
                }
                ${readOnly ? "opacity-60 cursor-not-allowed" : ""}
              `}
              // Only host can interact
              onClick={() => !readOnly && toggleCategory(cat._id)}
              disabled={readOnly}
              tabIndex={readOnly ? -1 : 0}
            >
              {cat.displayName?.mk || cat.name}
            </button>
          ))}
        </div>
      )}
      {/* Show Save button only for host */}
      {!readOnly && (
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={selectedCategories.length === 0}
        >
          Зачувај категории
        </Button>
      )}
    </GlassCard>
  );
}
