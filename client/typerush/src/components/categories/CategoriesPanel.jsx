import { useEffect, useState } from "react";
import GlassCard from "@/components/global/GlassCard";
import api from "@/lib/axios";
import { useError } from "@/hooks/useError";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Plus, Pencil } from "lucide-react";
import { Textarea } from "../ui/textarea";
import CategoryEditModal from "@/components/categories/CategoryEditModal";
import { useAuth } from "@/context/AuthContext";

export default function CategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newWords, setNewWords] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { showError, showSuccess } = useError();
  const { user } = useAuth();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/categories");
      setCategories(res.data.categories || []);
    } catch (err) {
      showError("Не може да се вчитаат категориите.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const defaultCategories = categories.filter((c) => c.isDefault);
  const playerCategories = categories.filter((c) => !c.isDefault);

  const handleAddCategory = async () => {
    if (!newName || !newWords || !newDescription) {
      showError("Пополнете ги сите полиња!");
      return;
    }
    try {
      setSaving(true);
      const res = await api.post("/categories", {
        name: newName.trim(),
        description: newDescription.trim(),
        words: newWords
          .split(",")
          .map((w) => w.trim())
          .filter(Boolean),
      });
      showSuccess("Категоријата е додадена!");
      setNewName("");
      setNewWords("");
      setNewDescription("");
      setCategories((prev) => [...prev, res.data.category]);
    } catch (err) {
      showError(
        err.response?.data?.message || "Грешка при додавање категорија."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      const res = await api.put(`/categories/${id}`, data);
      setCategories((prev) =>
        prev.map((c) => (c._id === id ? res.data.category : c))
      );
      showSuccess("Категоријата е изменета!");
      setSelectedCategory(null);
    } catch {
      showError("Грешка при ажурирање категорија.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      showSuccess("Категоријата е избришана!");
      setSelectedCategory(null);
    } catch {
      showError("Грешка при бришење категорија.");
    }
  };

  const renderCategory = (cat) => {
    const canEdit =
      user?.role === "admin" || user?.id === String(cat.createdBy);

    return (
      <li
        key={cat._id}
        className="flex justify-between items-center bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 p-2 rounded-lg text-[var(--text)]"
      >
        <div>
          <p className="font-semibold">{cat.name}</p>
          {cat.description && (
            <p className="text-[var(--text)]/70 text-xs">{cat.description}</p>
          )}
        </div>
        {canEdit && (
          <button
            onClick={() => setSelectedCategory(cat)}
            className="ml-2 text-[var(--primary)] hover:text-[var(--accent)]"
            title="Измени категорија"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </li>
    );
  };

  return (
    <>
      <GlassCard className="flex flex-col gap-3 p-4 h-full">
        <h3 className="font-bold text-[var(--primary)] text-xl">Категории</h3>

        {loading ? (
          <p className="text-[var(--glass)] text-sm">Се вчитува...</p>
        ) : (
          <>
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="group flex justify-between items-center mb-1 w-full font-semibold text-[var(--primary)] text-lg">
                Основни
                <ChevronDown className="w-5 h-5 text-[var(--primary)] group-data-[state=open]:rotate-180 transition-transform" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="space-y-2 ml-2 max-h-40 overflow-y-auto text-sm">
                  {defaultCategories.length > 0 ? (
                    defaultCategories.map(renderCategory)
                  ) : (
                    <li className="text-[var(--glass)]">
                      Нема основни категории
                    </li>
                  )}
                </ul>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="group flex justify-between items-center mb-1 w-full font-semibold text-[var(--primary)] text-lg">
                Додадени од играчите
                <ChevronDown className="w-5 h-5 text-[var(--primary)] group-data-[state=open]:rotate-180 transition-transform" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="space-y-2 ml-2 max-h-40 overflow-y-auto text-sm">
                  {playerCategories.length > 0 ? (
                    playerCategories.map(renderCategory)
                  ) : (
                    <li className="text-[var(--glass)]">
                      Сè уште нема додадени
                    </li>
                  )}
                </ul>
              </CollapsibleContent>
            </Collapsible>

            {/* Add new */}
            <Collapsible>
              <CollapsibleTrigger className="group flex justify-between items-center mb-1 w-full font-semibold text-[var(--primary)] text-lg">
                Додади категорија
                <Plus className="w-5 h-5 text-[var(--primary)] group-data-[state=open]:rotate-45 transition-transform" />
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col gap-2">
                <Input
                  placeholder="Име на категоријата"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <Textarea
                  placeholder="Опис на категоријата"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="h-20"
                />
                <Textarea
                  placeholder="Зборови (запирка)"
                  value={newWords}
                  onChange={(e) => setNewWords(e.target.value)}
                  className="h-28"
                />
                <Button
                  className="w-full"
                  onClick={handleAddCategory}
                  disabled={saving}
                >
                  {saving ? "Се зачувува..." : "Зачувај"}
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {/* Modal */}
      </GlassCard>{" "}
      <CategoryEditModal
        show={!!selectedCategory}
        category={selectedCategory}
        canEdit={
          user?.role === "admin" ||
          (selectedCategory && user?.id === selectedCategory.createdBy)
        }
        onClose={() => setSelectedCategory(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </>
  );
}
