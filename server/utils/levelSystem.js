function addWordPower(user, amount) {
  const WP_PER_LEVEL = 100; // fixed for now
  user.wordPower += amount;

  // Calculate new level
  user.level = Math.floor(user.wordPower / WP_PER_LEVEL) + 1;

  return user;
}

module.exports = { addWordPower };
