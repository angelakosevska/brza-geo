const User = require("../models/User");
const { addWordPower, getLevelProgress } = require("../utils/levelSystem");

/**
 * GET /api/user/profile/:id
 * Fetch a user's profile with progress details.
 *
 * Returns:
 * - username
 * - level
 * - wordPower (total XP)
 * - wpAtLevelStart → XP at the start of current level
 * - wpForNextLevel → XP required to reach next level
 * - currentLevelWP → how much XP user has gained in current level
 * - progressPercent → percentage toward next level
 */

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "username level wordPower"
    );
    if (!user)
      return res.status(404).json({ message: res.__("user_not_found") });

    const progress = getLevelProgress(user.wordPower);

    res.json({
      username: user.username,
      level: user.level,
      wordPower: user.wordPower,
      ...progress, // wpAtLevelStart, wpForNextLevel, currentLevelWP, progressPercent
    });
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ message: res.__("failed_fetch_profile") });
  }
};


// exports.addWordPowerToUser = async (req, res) => {
//   try {
//     const { amount } = req.body;

//     let user = await User.findById(req.params.id);
//     if (!user) {
//       return res.status(404).json({ message: res.__("user_not_found") });
//     }

//     // Add XP + recalc level
//     addWordPower(user, amount);
//     await user.save();

//     // Compute progress details
//     const progress = getLevelProgress(user.wordPower);

//     res.json({
//       wordPower: user.wordPower,
//       level: user.level,
//       ...progress,
//       message: res.__("word_power_updated"),
//     });
//   } catch (err) {
//     console.error("❌ addWordPowerToUser error:", err);
//     res.status(500).json({ message: res.__("failed_update_wordpower") });
//   }
// };
