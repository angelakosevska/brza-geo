import GlassCard from "@/components/global/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateAnswer } from "@/lib/validateAnswer";

export default function CategoryAnswersCard({
  title = "Внеси ги твоите одговори",
  categories = [],
  categoryLabels = {},
  letter,
  answers = {},
  onChange,
  submitted = false,
  timeLeft = 0,
  enforceStartsWith = false,
  className = "",
  mode = "play", // "play" | "review"
  waitingForRound = false,
  showSubmit,
  showStop,
  onSubmit,
  onStop,
  code,
  dictByCategory = {}, // default празно object
}) {
  // Map validation status to Tailwind border + text colors
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
    exact: "✔️ Точен збор",
    typo: "⚠️ Мала грешка (прифатено)",
    "no-words": "🟠 Нема зборови за оваа буква во категоријата",
    "wrong-letter": "❌ Почнува со погрешна буква",
    "not-in-dictionary": "❌ Не е во речникот за оваа категорија",
    "not-cyrillic": "❌ Користи кирилица (А-Ш)",
    empty: "",
  };

  const textColors = {
    exact: "text-green-600",
    typo: "text-yellow-600",
    "no-words": "text-orange-600",
    "wrong-letter": "text-red-600",
    "not-in-dictionary": "text-red-600",
    "not-cyrillic": "text-red-600",
    empty: "text-gray-400",
  };

  const disabled =
    mode !== "play" || waitingForRound || submitted || (timeLeft ?? 0) <= 0;

  const handleChange = (id, raw) => {
    let val = raw;
    if (enforceStartsWith && letter && typeof raw === "string") {
      if (raw.length === 1) val = raw.toUpperCase();
    }
    onChange?.(id, val);
  };

  return (
    <GlassCard className={`p-6 text-[var(--text)] ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="font-semibold">{title}</div>
        <div className="flex items-center gap-2 opacity-70 text-xs">
          <span>Код на соба: </span>
          <span className="text-[var(--secondary)]">{code}</span>
        </div>
      </div>

      {/* Answer inputs */}
      <div className="gap-6 grid">
        {categories.length === 0 ? (
          <div className="opacity-70 py-10 text-center">Чекам категории…</div>
        ) : (
          categories.map((id) => {
            const value = answers[id] ?? "";
            const dictWords = dictByCategory[String(id)] || [];

            // ако нема речник → сепак прави basic валидација
            const { status } = validateAnswer(value, letter, dictWords);

            console.log("🔎 Answer validation", {
              id,
              value,
              letter,
              dictWordsCount: dictWords.length,
              status,
              preview: dictWords.slice(0, 3),
            });

            return (
              <div key={id} className="gap-1 grid">
                <div className="items-center gap-3 grid grid-cols-12">
                  <label
                    htmlFor={`answer-${id}`}
                    className="col-span-12 lg:col-span-4 font-medium text-sm truncate"
                    title={categoryLabels[id] || id}
                  >
                    {categoryLabels[id] || id}
                  </label>
                  <div className="col-span-12 lg:col-span-8">
                    <Input
                      id={`answer-${id}`}
                      placeholder={letter ? `Почнува со ${letter}` : "Одговор"}
                      value={value}
                      onChange={(e) => handleChange(id, e.target.value)}
                      disabled={disabled}
                      aria-label={`${categoryLabels[id] || id} answer`}
                      className={`w-full border-2 ${
                        borderColors[status] || "border-gray-300"
                      }`}
                    />
                  </div>
                </div>
                {/* Feedback text */}
                <span
                  className={`text-xs ml-2 ${
                    textColors[status] || "text-gray-400"
                  }`}
                >
                  {textMessages[status]}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / helper */}
      <div className="flex flex-wrap justify-between items-center gap-3 opacity-70 mt-6 text-xs">
        <div>
          {mode !== "play"
            ? "Резултати помеѓу рунди."
            : waitingForRound
            ? "Чекам да почне рундата…"
            : submitted
            ? "Испратено. Не можеш да уредуваш."
            : (timeLeft ?? 0) > 0
            ? "Можеш да уредуваш додека не истече времето."
            : "Времето истече."}
        </div>

        {mode === "play" && !waitingForRound && (
          <div className="flex items-center gap-2">
            {showStop && (
              <Button
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
                onClick={onSubmit}
                disabled={submitted || (timeLeft ?? 0) <= 0}
              >
                {submitted ? "Испратено" : "Испрати"}
              </Button>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
