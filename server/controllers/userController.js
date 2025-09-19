const User = require("../models/User");
const { addWordPower } = require("../utils/levelSystem");

/**
 * GET /api/user/profile/:id
 * Returns username, level, and wordPower for a user
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("username level wordPower");
    if (!user) return res.status(404).json({ message: res.__("user_not_found") });
    res.json(user);
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ message: res.__("failed_fetch_profile") });
  }
};

/**
 * POST /api/user/:id/addWP
 * Add Word Power points to a user and recalc level
 */
exports.addWordPowerToUser = async (req, res) => {
  try {
    const { amount } = req.body;
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: res.__("user_not_found") });

    addWordPower(user, amount);
    await user.save();

    res.json({
      wordPower: user.wordPower,
      level: user.level,
      message: res.__("word_power_updated"),
    });
  } catch (err) {
    console.error("addWordPowerToUser error:", err);
    res.status(500).json({ message: res.__("failed_update_wordpower") });
  }
};
