const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token

  if (!token) {
    return res.status(401).json({ message: 'Нема пристап, нема токен.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // attach user info to request object
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Токенот не е валиден.' });
  }
}

module.exports = verifyToken;
