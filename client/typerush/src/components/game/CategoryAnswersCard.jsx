import { useRef, useEffect } from "react";
import GlassCard from "@/components/global/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateAnswer } from "@/lib/validateAnswer";

// Lucide icons
import {
  CheckCircle,
  AlertTriangle,
  BookX,
  XCircle,
  Languages,
} from "lucide-react";

// Ensures the value always starts with the round letter
function ensureStartsWithLetter(value, letter) {
  if (!letter) return value ?? "";
  const L = letter[0]; // just the first char
  let v = value ?? "";

  // Always at least the letter
  if (v.length === 0) return L;

  // If first char is wrong → fix it
  if (v[0].toUpperCase() !== L.toUpperCase()) {
    v = L + v.slice(1);
  } else {
    // Fix case if needed
    if (v[0] !== L) {
      v = L + v.slice(1);
    }
  }

  // Collapse duplicates like "КК..." → "К..."
  const dup = new RegExp(`^${L}{2,}`, "i");
  v = v.replace(dup, L);

  return v;
}

export default function CategoryAnswersCard({
  categories = [],
  categoryLabels = {},
  letter,
  answers = {},
  onChange,
  submitted = false,
  timeLeft = 0,
  enforceStartsWith = true, // force locked first letter
  className = "",
  mode = "play", // "play" | "review"
  waitingForRound = false,
  showSubmit,
  showStop,
  onSubmit,
  onStop,
  dictByCategory = {},
}) {
  // ========== UI COLORS ==========
  const borderColors = {
    exact: "border-green-500",
    typo: "border-yellow-500",
    "no-words": "border-orange-500",
    "wrong-letter": "border-red-500",
    "not-in-dictionary": "border-red-500",
    "not-cyrillic": "border-red-500",
    empty: "border-gray-300",
  };

  const textMessages = {
    exact: "Точен збор",
    typo: "Мала грешка (прифатено)",
    "no-words": "Нема зборови за оваа буква во категоријата",
    "wrong-letter": "Почнува со погрешна буква",
    "not-in-dictionary": "Не е во речникот за оваа категорија",
    "not-cyrillic": "Користи кирилица (А-Ш)",
    empty: "",
  };

  const textColors = {
    exact: "text-green-600",
    typo: "text-yellow-600",
    "no-words": "text-orange-600",
    "wrong-letter": "text-red-600",
    "not-in-dictionary": "text-red-600",
    "not-cyrillic": "text-red-600",
    empty: "text-[var(--text)]",
  };

  const icons = {
    exact: <CheckCircle className="inline w-4 h-4 text-green-600" />,
    typo: <AlertTriangle className="inline w-4 h-4 text-yellow-600" />,
    "no-words": <BookX className="inline w-4 h-4 text-orange-600" />,
    "wrong-letter": <XCircle className="inline w-4 h-4 text-red-600" />,
    "not-in-dictionary": <BookX className="inline w-4 h-4 text-red-600" />,
    "not-cyrillic": <Languages className="inline w-4 h-4 text-red-600" />,
    empty: null,
  };

  // ========== STATE ==========
  const disabled =
    mode !== "play" || waitingForRound || submitted || (timeLeft ?? 0) <= 0;

  const inputRefs = useRef({});
  const setInputRef = (id) => (el) => {
    if (el) inputRefs.current[id] = el;
  };

  // ========== CHANGE HANDLER ==========
  const handleChange = (id, raw) => {
    let val = raw;
    if (enforceStartsWith && letter) {
      const before = val;
      val = ensureStartsWithLetter(val, letter);

      const ref = inputRefs.current[id];
      if (ref && before !== val) {
        // Keep caret at least after the first letter
        const pos = Math.max(1, ref.selectionStart ?? 1);
        requestAnimationFrame(() => {
          try {
            ref.setSelectionRange(pos, pos);
          } catch {}
        });
      }
    }
    onChange?.(id, val);
  };

  // ========== RENDER ==========
  return (
    <div className={`grid gap-1 ${className}`}>
      {/* Header */}
      <GlassCard className="flex md:flex-row flex-col justify-between items-start md:items-center gap-2 p-4 text-[var(--text)]">
        <div className="flex flex-col">
          <div className="font-semibold text-[var(--primary)] text-base sm:text-lg">
            Внеси ги твоите одговори
          </div>
          <div className="opacity-70 text-xs sm:text-sm">
            {mode !== "play"
              ? "Резултати помеѓу рунди."
              : waitingForRound
              ? "Чекам да почне рундата…"
              : submitted
              ? "Испратено. Не можеш да уредуваш."
              : (timeLeft ?? 0) > 0
              ? showSubmit
                ? "Рундата завршува кога сите ќе притиснат „Испрати“ или кога ќе истече времето."
                : showStop
                ? "Кликни „Стоп“ откако ќе ги пополниш сите полиња и стопирај ја играта за сите. Одговорите на сите ќе се превземат автоматски"
                : "Можеш да уредуваш додека не истече времето."
              : "Времето истече."}
          </div>
        </div>

        {/* Desktop buttons */}
        {mode === "play" && !waitingForRound && (
          <div className="hidden md:flex items-center gap-2">
            {showStop && (
              <Button
                size="lg"
                variant="destructive"
                onClick={onStop}
                disabled={(timeLeft ?? 0) <= 0}
                title="Заврши ја рундата за сите"
              >
                Стоп
              </Button>
            )}
            {showSubmit && (
              <Button
                size="lg"
                onClick={onSubmit}
                disabled={submitted || (timeLeft ?? 0) <= 0}
              >
                {submitted ? "Испратено" : "Испрати"}
              </Button>
            )}
          </div>
        )}
      </GlassCard>

      {/* Answer inputs */}
      {categories.length === 0 ? (
        <GlassCard className="opacity-70 p-6 text-center">
          Чекам категории…
        </GlassCard>
      ) : (
        <div className="gap-1 grid md:grid-cols-2 lg:grid-cols-3">
          {categories.map((id) => {
            const rawValue = answers[id];
            // Always seed with letter if empty
            const value =
              rawValue == null || rawValue === ""
                ? letter || ""
                : ensureStartsWithLetter(rawValue, letter);

            const dictWords = dictByCategory[String(id)] || [];
            const { status } = validateAnswer(value, letter, dictWords);

            return (
              <GlassCard
                key={id}
                className="flex flex-col gap-1 text-[var(--text)]"
              >
                <label
                  htmlFor={`answer-${id}`}
                  className="mb-1 font-medium text-sm sm:text-base truncate"
                  title={categoryLabels[id] || id}
                >
                  {categoryLabels[id] || id}
                </label>

                <Input
                  id={`answer-${id}`}
                  name={`answer-${id}`}
                  autoComplete="off"
                  placeholder={letter ? `${letter}...` : "Одговор"}
                  value={value}
                  onChange={(e) => handleChange(id, e.target.value)}
                  disabled={disabled}
                  aria-label={`${categoryLabels[id] || id} answer`}
                  ref={setInputRef(id)}
                  status={status}
                />

                <span
                  className={`text-xs mt-1 flex items-center gap-1 ${
                    textColors[status] || "text-gray-400"
                  }`}
                >
                  {icons[status]}
                  {textMessages[status]}
                </span>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Mobile floating buttons */}
      {mode === "play" && !waitingForRound && (
        <div className="md:hidden right-4 bottom-4 z-50 fixed flex gap-3">
          {showStop && (
            <Button
              size="lg"
              variant="destructive"
              onClick={onStop}
              disabled={(timeLeft ?? 0) <= 0}
              className="shadow-lg backdrop-blur px-8 py-4 rounded-full"
            >
              Стоп
            </Button>
          )}
          {showSubmit && (
            <Button
              size="lg"
              onClick={onSubmit}
              disabled={submitted || (timeLeft ?? 0) <= 0}
              className="bg-[var(--primary)]/80 shadow-lg backdrop-blur px-8 py-4 rounded-full"
            >
              {submitted ? "Испратено" : "Испрати"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
