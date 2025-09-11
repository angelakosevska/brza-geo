const User = require("../models/User");
const { addWordPower } = require("../utils/levelSystem");

// GET /api/user/profile/:id
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("username level wordPower");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// POST /api/user/:id/addWP
exports.addWordPowerToUser = async (req, res) => {
  try {
    const { amount } = req.body;
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    addWordPower(user, amount);
    await user.save();

    res.json({ wordPower: user.wordPower, level: user.level });
  } catch (err) {
    console.error("addWordPowerToUser error:", err);
    res.status(500).json({ error: "Failed to update Word Power" });
  }
};
