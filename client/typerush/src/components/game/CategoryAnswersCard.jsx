
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

  // NEW:
  mode = "play",              // "play" | "review"
  waitingForRound = false,    // true until roundStarted sets endAt/letter/categories
  showSubmit = false,
  showStop = false,
  isHost = false,
  onSubmit,
  onStop,
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
      <div className="mb-4 flex items-center justify-between">
        <div className="font-semibold">{title}</div>
        <div className="flex items-center gap-2 text-xs opacity-70">
          <span>Почнува со</span>
          <span className="font-mono">{letter ?? "—"}</span>
        </div>
      </div>

      <div className="grid gap-4">
        {categories.length === 0 ? (
          <div className="py-10 text-center opacity-70">Чекам категории…</div>
        ) : (
          categories.map((id) => (
            <div key={id} className="grid grid-cols-12 items-center gap-3">
              <label
                htmlFor={`answer-${id}`}
                className="col-span-12 lg:col-span-4 truncate text-sm font-medium"
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
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs opacity-70">
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
            {showStop && isHost && (
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
