import GlassCard from "@/components/global/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateAnswer } from "@/lib/validateAnswer";

export default function CategoryAnswersCard({
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
  dictByCategory = {}, 
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
    empty: "text-[var(--text)]",
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
    <div className={`grid gap-1 ${className}`}>
      {/* Header со статус */}
      <GlassCard className="flex md:flex-row flex-col justify-between items-start md:items-center gap-1 p-4 text-[var(--text)]">
        <div className="flex flex-col">
          <div className="font-semibold text-[var(--primary)] text-lg">
            Внеси ги твоите одговори
          </div>
          <div className="opacity-70 mt-1 text-xs">
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
        </div>

        {/* Desktop копчиња */}
        {mode === "play" && !waitingForRound && (
          <div className="hidden md:flex items-center gap-1">
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
        <div className="gap-1 grid md:grid-cols-2">
          {categories.map((id) => {
            const value = answers[id] ?? "";
            const dictWords = dictByCategory[String(id)] || [];
            const { status } = validateAnswer(value, letter, dictWords);

            return (
              <GlassCard
                key={id}
                className="flex flex-col p-4 text-[var(--text)]"
              >
                {/* Label */}
                <label
                  htmlFor={`answer-${id}`}
                  className="font-medium text-sm truncate"
                  title={categoryLabels[id] || id}
                >
                  {categoryLabels[id] || id}
                </label>

                {/* Input */}
                <Input
                  id={`answer-${id}`}
                  placeholder={letter ? `Почнува со ${letter}` : "Одговор"}
                  value={value}
                  onChange={(e) => handleChange(id, e.target.value)}
                  disabled={disabled}
                  aria-label={`${categoryLabels[id] || id} answer`}
                  className={`w-full ${
                    borderColors[status] || ""
                  } focus-visible:ring-2 focus-visible:ring-[var(--primary)]`}
                />

                {/* Feedback text */}
                <span
                  className={`text-xs ${textColors[status] || "text-gray-400"}`}
                >
                  {textMessages[status]}
                </span>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Mobile floating копчиња */}
      {mode === "play" && !waitingForRound && (
        <div className="md:hidden right-4 bottom-4 z-50 fixed flex gap-3">
          {showStop && (
            <Button
              size="lg"
              variant="destructive"
              onClick={onStop}
              disabled={(timeLeft ?? 0) <= 0}
              className="px-8 py-4 rounded-full"
            >
              Стоп
            </Button>
          )}
          {showSubmit && (
            <Button
              size="lg"
              onClick={onSubmit}
              disabled={submitted || (timeLeft ?? 0) <= 0}
              className="px-8 py-4 rounded-full"
            >
              {submitted ? "Испратено" : "Испрати"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
