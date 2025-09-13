import { distance } from "fastest-levenshtein";

export function validateAnswer(raw, letter, dictWords = []) {
  const word = (raw || "").trim().toLowerCase();
  const upperLetter = (letter || "").toUpperCase();

  if (!word) return { status: "empty" };

  // ✅ проверка за кирилица
  const cyrillicRegex = /^[\u0400-\u04FF]/;
  if (!cyrillicRegex.test(word[0])) {
    return { status: "not-cyrillic" };
  }

  // нормализирај речник
  const normalizedDict = dictWords.map((w) => String(w).trim().toLowerCase());

  // проверка за правилна буква
  if (word[0]?.toUpperCase() !== upperLetter) {
    return { status: "wrong-letter" };
  }

  // зборови со таа буква
  const wordsForLetter = normalizedDict.filter(
    (w) => w[0]?.toUpperCase() === upperLetter
  );

  if (wordsForLetter.length === 0) {
    return { status: "no-words" };
  }

  if (wordsForLetter.includes(word)) {
    return { status: "exact" };
  }

  if (wordsForLetter.some((dw) => distance(word, dw) === 1)) {
    return { status: "typo" };
  }

  return { status: "not-in-dictionary" };
}
