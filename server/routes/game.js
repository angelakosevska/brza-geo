const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// Example protected route
router.get('/profile', verifyToken, (req, res) => {
  res.json({
    message: `Добредојде, ${req.user.username}! Ова е заштитена рута.`,
    user: req.user
  });
});

module.exports = router;
