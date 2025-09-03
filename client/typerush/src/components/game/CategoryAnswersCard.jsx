import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  waitingForRound = false, // true until roundStarted sets endAt/letter/categories
  showSubmit,
  showStop,
  onSubmit,
  onStop,
  code,
}) {
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
      <div className="flex justify-between items-center mb-4">
        <div className="font-semibold">{title}</div>
        <div className="flex items-center gap-2 opacity-70 text-xs">
          <span>Код на соба: </span>
          <span className="text-[var(--secondary)]">{code}</span>
        </div>
      </div>

      <div className="gap-4 grid">
        {categories.length === 0 ? (
          <div className="opacity-70 py-10 text-center">Чекам категории…</div>
        ) : (
          categories.map((id) => (
            <div key={id} className="items-center gap-3 grid grid-cols-12">
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
                  value={answers[id] ?? ""}
                  onChange={(e) => handleChange(id, e.target.value)}
                  disabled={disabled}
                  aria-label={`${categoryLabels[id] || id} answer`}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* helper + (optional) actions */}
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
