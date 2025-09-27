const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Нема пристап, нема токен." });
  }

  try {
    // Decode and verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load the user from DB and check session
    const user = await User.findById(decoded.userId).select("currentSessionId");
    if (!user) {
      return res.status(401).json({ message: "Корисникот не постои." });
    }

    if (user.currentSessionId !== decoded.sid) {
      // sid mismatch means the user logged in somewhere else
      return res.status(401).json({ message: "Сесијата е невалидна. Најавете се повторно." });
    }

    // Attach the user and session info for downstream routes
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      sid: decoded.sid,
    };

    next();
  } catch (err) {
    return res.status(403).json({ message: "Токенот не е валиден." });
  }
}

module.exports = verifyToken;
