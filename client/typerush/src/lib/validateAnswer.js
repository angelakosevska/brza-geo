//function that validates the answers in realtime when players input answers
export function validateAnswer(raw, letter, dictWords = []) {
  const word = (raw || "").trim().toLowerCase();
  const upperLetter = (letter || "").toUpperCase();

  if (!word) return { status: "empty" };

  const cyrillicRegex = /^[\u0400-\u04FF]/;
  if (!cyrillicRegex.test(word[0])) {
    return { status: "not-cyrillic" };
  }

  // Normalize dictionary
  const normalizedDict = dictWords.map((w) => String(w).trim().toLowerCase());

  // Check starting letter
  if (word[0]?.toUpperCase() !== upperLetter) {
    return { status: "wrong-letter" };
  }

  // Words starting with the round letter
  const wordsForLetter = normalizedDict.filter(
    (w) => w[0]?.toUpperCase() === upperLetter
  );

  if (wordsForLetter.length === 0) {
    return { status: "no-words" };
  }

  // Exact dictionary match
  if (wordsForLetter.includes(word)) {
    return { status: "exact" };
  }

  // Not found in dictionary
  return { status: "not-in-dictionary" };
}
