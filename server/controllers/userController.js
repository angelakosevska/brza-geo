const User = require("../models/User");
const { addWordPower, getLevelProgress } = require("../utils/levelSystem");



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

