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
import { ChevronDown } from "lucide-react";

export default function CategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // inputs for adding new category
  const [newName, setNewName] = useState("");
  const [newWords, setNewWords] = useState("");
  const [saving, setSaving] = useState(false);

  const { showError, showSuccess } = useError();

  // fetch categories
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
    if (!newName || !newWords) {
      showError("Пополнете ги сите полиња!");
      return;
    }

    try {
      setSaving(true);
      const res = await api.post("/categories", {
        name: newName.trim(),
        words: newWords.split(",").map((w) => w.trim()).filter(Boolean),
      });

      showSuccess("Категоријата е додадена!");
      setNewName("");
      setNewWords("");
      setCategories((prev) => [...prev, res.data.category]);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Грешка при додавање категорија.";
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard className="flex flex-col gap-3 p-4 h-full">
      <h3 className="font-bold text-[var(--primary)] text-lg">Категории</h3>

      {loading ? (
        <p className="text-[var(--glass)] text-sm">Се вчитува...</p>
      ) : (
        <>
          {/* Default categories */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex justify-between items-center mb-1 w-full font-semibold">
              Основни
              <ChevronDown className="w-4 h-4 data-[state=open]:rotate-180 transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-1 ml-4 max-h-40 overflow-y-auto text-sm list-disc">
                {defaultCategories.length > 0 ? (
                  defaultCategories.map((cat) => (
                    <li key={cat._id}>{cat.name}</li>
                  ))
                ) : (
                  <li className="text-[var(--glass)]">Нема основни категории</li>
                )}
              </ul>
            </CollapsibleContent>
          </Collapsible>

          {/* Player categories */}
          <Collapsible>
            <CollapsibleTrigger className="flex justify-between items-center mb-1 w-full font-semibold">
              Додадени од играчите
              <ChevronDown className="w-4 h-4 data-[state=open]:rotate-180 transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-1 ml-4 max-h-40 overflow-y-auto text-sm list-disc">
                {playerCategories.length > 0 ? (
                  playerCategories.map((cat) => (
                    <li key={cat._id}>{cat.name}</li>
                  ))
                ) : (
                  <li className="text-[var(--glass)]">Сè уште нема додадени</li>
                )}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}

      {/* Add new category form */}
      <div className="mt-3 pt-3 border-[var(--glass)]/30 border-t">
        <h4 className="mb-2 font-semibold text-sm">Додади категорија</h4>
        <Input
          placeholder="Име на категоријата"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="mb-2"
        />
        <Input
          placeholder="Зборови (одделени со запирка)"
          value={newWords}
          onChange={(e) => setNewWords(e.target.value)}
          className="mb-2"
        />
        <Button
          className="w-full"
          onClick={handleAddCategory}
          disabled={saving}
        >
          {saving ? "Се зачувува..." : "Зачувај"}
        </Button>
      </div>
    </GlassCard>
  );
}
