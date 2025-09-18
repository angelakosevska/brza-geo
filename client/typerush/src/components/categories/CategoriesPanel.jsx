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
import { ChevronDown, PlusCircle } from "lucide-react";
import { Textarea } from "../ui/textarea";

export default function CategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // inputs for adding new category
  const [newName, setNewName] = useState("");
  const [newWords, setNewWords] = useState("");
  const [newDescription, setNewDescription] = useState("");
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
      const msg =
        err.response?.data?.message || "Грешка при додавање категорија.";
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard className="flex flex-col gap-3 p-4 h-full">
      {/* Главен наслов HL */}
      <h3 className="font-bold text-[var(--primary)] text-xl">Категории</h3>

      {loading ? (
        <p className="text-[var(--glass)] text-sm">Се вчитува...</p>
      ) : (
        <>
          {/* Default categories */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex justify-between items-center mb-1 w-full font-semibold text-[var(--primary)] text-lg">
              Основни
              <ChevronDown className="w-4 h-4 text-[var(--primary)] data-[state=open]:rotate-90 transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-2 ml-2 max-h-40 overflow-y-auto text-sm">
                {defaultCategories.length > 0 ? (
                  defaultCategories.map((cat) => (
                    <li
                      key={cat._id}
                      className="bg-[var(--primary)]/10 p-2 rounded-lg text-[var(--text)]"
                    >
                      <p className="font-semibold">{cat.name}</p>
                      {cat.description && (
                        <p className="text-[var(--text)]/70 text-xs">
                          {cat.description}
                        </p>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="text-[var(--glass)]">
                    Нема основни категории
                  </li>
                )}
              </ul>
            </CollapsibleContent>
          </Collapsible>

          {/* Player categories */}
          <Collapsible>
            <CollapsibleTrigger className="flex justify-between items-center mb-1 w-full font-semibold text-[var(--primary)] text-lg">
              Додадени од играчите
              <ChevronDown className="w-4 h-4 text-[var(--primary)] data-[state=open]:rotate-90 transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-2 ml-2 max-h-40 overflow-y-auto text-sm">
                {playerCategories.length > 0 ? (
                  playerCategories.map((cat) => (
                    <li
                      key={cat._id}
                      className="bg-[var(--primary)]/10 p-2 rounded-lg text-[var(--text)]"
                    >
                      <p className="font-semibold">{cat.name}</p>
                      {cat.description && (
                        <p className="text-[var(--text)]/70 text-xs">
                          {cat.description}
                        </p>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="text-[var(--glass)]">Сè уште нема додадени</li>
                )}
              </ul>
            </CollapsibleContent>
          </Collapsible>

          {/* Add new category form */}
          <Collapsible>
            <CollapsibleTrigger className="flex justify-between items-center mb-1 w-full font-semibold text-[var(--primary)] text-lg">
              Додади категорија
              <PlusCircle className="w-4 h-4 text-[var(--primary)]" />
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
                placeholder="Зборови (одделени со запирка)"
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
    </GlassCard>
  );
}
