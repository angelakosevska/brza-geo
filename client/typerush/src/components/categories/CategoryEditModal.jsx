import GlassCard from "@/components/global/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

export default function CategoryEditModal({
  show = false,
  category = null,
  canEdit = false,
  onClose,
  onUpdate,
  onDelete,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [words, setWords] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync when category changes
  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setDescription(category.description || "");
      setWords(category.words?.join(", ") || "");
    }
  }, [category]);

  if (!show || !category) return null;

  return (
    <div className="z-50 fixed inset-0">
      {/* Background overlay */}
      <div className="absolute inset-0 backdrop-blur-lg" onClick={onClose} />

      {/* Modal body */}
      <div className="absolute inset-0 flex justify-center items-center p-4">
        <GlassCard className="relative p-4 w-full sm:max-w-[90vw] lg:max-w-[70vw] lg:max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-[var(--primary)] text-lg">
              Уреди категорија
            </h2>
            <Button variant="outline" size="sm" onClick={onClose}>
              Затвори
            </Button>
          </div>

          {/* Content */}
          {canEdit ? (
            <div className="flex flex-col gap-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Име"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опис"
                className="h-20"
              />
              <Textarea
                value={words}
                onChange={(e) => setWords(e.target.value)}
                placeholder="Зборови (одделени со запирка на кирилица)"
                className="h-28"
              />
            </div>
          ) : (
            <p className="opacity-80 text-sm">
              Немаш дозвола да ја уредуваш оваа категорија.
            </p>
          )}

          {/* Footer actions */}
          {canEdit && (
            <div className="flex justify-between items-center gap-4 mt-6">
              {/* <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(category._id)}
              >
                Избриши
              </Button> */}
              {!confirmDelete ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                >
                  Избриши
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text)] text-sm">Сигурно?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(category._id)}
                  >
                    Да
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Откажи
                  </Button>
                </div>
              )}
              <Button
                size="sm"
                onClick={() =>
                  onUpdate(category._id, {
                    name,
                    description,
                    words: words
                      .split(",")
                      .map((w) => w.trim())
                      .filter(Boolean),
                  })
                }
              >
                Зачувај
              </Button>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
