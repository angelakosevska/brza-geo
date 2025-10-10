import { useRef, useState } from "react";
import GlassCard from "@/components/global/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateAnswer } from "@/lib/validateAnswer";
import { socket } from "@/lib/socket"; 
import { useError } from "@/hooks/useError"; 

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
  const L = letter[0];
  let v = value ?? "";
  if (v.length === 0) return L;
  if (v[0].toUpperCase() !== L.toUpperCase()) {
    v = L + v.slice(1);
  } else if (v[0] !== L) {
    v = L + v.slice(1);
  }
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
  enforceStartsWith = true,
  className = "",
  mode = "play",
  waitingForRound = false,
  showSubmit,
  showStop,
  onSubmit,
  onStop,
  dictByCategory = {},
}) {
  const { showInfo } = useError();
  const [suggested, setSuggested] = useState(new Set());

  // ========== UI HELPERS ==========
  const textMessages = {
    exact: "Точен збор",
    "no-words": "Нема збор во категоријата на оваа буква",
    "wrong-letter": "Почнува со погрешна буква",
    "not-in-dictionary": "Грешен збор",
    "not-cyrillic": "Користи кирилица (А-Ш)",
    empty: "",
  };

  const textColors = {
    exact: "text-green-600",
    "no-words": "text-orange-600",
    "wrong-letter": "text-red-600",
    "not-in-dictionary": "text-red-600",
    "not-cyrillic": "text-red-600",
    empty: "text-[var(--text)]",
  };

  const icons = {
    exact: <CheckCircle className="inline w-4 h-4 text-green-600" />,
    typo: <AlertTriangle className="inline w-4 h-4 text-yellow-600" />,
    "no-words": <BookX className="inline w-4 h-4 text-gray-600" />,
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

  // ========== MARK FOR REVIEW ==========
  const handleMarkForReview = (categoryId, value) => {
    const word = String(value || "").trim();
    if (!word || (letter && word.length <= 1)) {
      return showInfo("Напиши го целиот збор пред да го пратиш.");
    }
    if (suggested.has(word.toLowerCase())) {
      return showInfo("Овој збор веќе е предложен.");
    }

    socket.emit("markWordForReview", { categoryId, word });

    setSuggested((prev) => new Set(prev).add(word.toLowerCase()));
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
            const value =
              rawValue == null || rawValue === ""
                ? letter || ""
                : ensureStartsWithLetter(rawValue, letter);

            const dictWords = dictByCategory[String(id)] || [];
            const { status } = validateAnswer(value, letter, dictWords);

            const canSuggest =
              !submitted &&
              (status === "not-in-dictionary" || status === "no-words");

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

                <div className="flex justify-between items-center mt-1">
                  <span
                    className={`text-xs flex items-center gap-1 ${
                      textColors[status] || "text-gray-400"
                    }`}
                  >
                    {icons[status]}
                    {textMessages[status]}
                  </span>

                  {canSuggest && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkForReview(id, value)}
                      disabled={suggested.has(value.toLowerCase())}
                      className={`ml-2 px-2 py-1 text-xs ${
                        suggested.has(value.toLowerCase())
                          ? "bg-[var(--primary)] text-white"
                          : "hover:bg-[var(--primary)] hover:text-white"
                      }`}
                    >
                      {suggested.has(value.toLowerCase())
                        ? "Предложено"
                        : "Предложи"}
                    </Button>
                  )}
                </div>
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
