/**
 * Exponential level system
 * XP requirements grow with each level.
 *
 * Example progression:
 * - Level 1 → 2 requires 50 XP
 * - Level 2 → 3 requires ~106 XP
 * - Level 3 → 4 requires ~259 XP
 */
function addWordPower(user, amount) {
  const BASE = 100;     // Base XP for the first level
  const FACTOR = 1.5;  // Growth factor for next levels

  // Add earned Word Power
  user.wordPower += amount;

  let level = 1;
  let wpNeeded = BASE;
  let wpRemaining = user.wordPower;

  while (wpRemaining >= wpNeeded) {
    wpRemaining -= wpNeeded;
    level++;
    wpNeeded = Math.floor(BASE * Math.pow(level, FACTOR));
  }

  user.level = level;
  return user;
}


function getLevelProgress(wordPower) {
  const BASE = 50;
  const FACTOR = 1.5;

  let level = 1;
  let wpNeeded = BASE;
  let wpRemaining = wordPower;
  let wpAtLevelStart = 0;

  // Determine level and how much XP is "carried over"
  while (wpRemaining >= wpNeeded) {
    wpRemaining -= wpNeeded;
    wpAtLevelStart += wpNeeded;
    level++;
    wpNeeded = Math.floor(BASE * Math.pow(level, FACTOR));
  }

  const currentLevelWP = wordPower - wpAtLevelStart;
  const progressPercent = Math.min(
    100,
    Math.round((currentLevelWP / wpNeeded) * 100)
  );

  return {
    level,
    wpAtLevelStart,
    wpForNextLevel: wpNeeded,
    currentLevelWP,
    progressPercent,
  };
}

module.exports = { addWordPower, getLevelProgress };
