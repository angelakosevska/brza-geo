const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../utils/email");

// controllers/authController.js
exports.register = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: res.__("all_fields_required") });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: res.__("invalid_email") });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: res.__("password_too_short") });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: res.__("passwords_do_not_match") });
  }

  try {
    const existing = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { username: username.trim() },
      ],
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: res.__("username_or_email_taken") });
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hash, // legacy field (for compatibility)
      passwordHash: hash, // preferred field
    });

    // optional welcome email
    try {
      await require("../utils/email").sendWelcomeEmail(newUser);
    } catch (err) {
      console.warn("📭 Failed to send welcome email:", err.message);
    }

    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username }, // <-- fixed
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("❌ Registration Error:", err);
    return res.status(500).json({ message: res.__("registration_failed") });
  }
};

// controllers/authController.js
exports.login = async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ message: res.__("all_fields_required") });
    }

    // email or username
    const isEmail = validator.isEmail((login || "").trim());
    const query = isEmail
      ? { email: login.toLowerCase().trim() }
      : { username: login.trim() };

    // Try to fetch both fields: password (legacy) and passwordHash (new)
    const user = await User.findOne(query).select("+password +passwordHash");
    if (!user) {
      return res.status(401).json({ message: res.__("login_failed") });
    }

    const hash = user.passwordHash || user.password;
    if (!hash) {
      // No hash at all -> treat as invalid creds
      return res.status(401).json({ message: res.__("login_failed") });
    }

    const isMatch = await bcrypt.compare(password, hash);
    if (!isMatch) {
      return res.status(401).json({ message: res.__("login_failed") });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: res.__("server_error") });
  }
};

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ message: res.__("invalid_email") });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: res.__("user_not_found") });
  }

  // Generate 6‑digit numeric code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = resetCode;
  user.resetCodeExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save();

  try {
    await sendPasswordResetEmail(user, resetCode);
    res.status(200).json({ message: res.__("reset_email_sent") });
  } catch (err) {
    console.error("📭 Failed to send reset code:", err);
    res.status(500).json({ message: res.__("email_send_failed") });
  }
};

/**
 * Step 2: User submits code + new password
 */
exports.resetPassword = async (req, res) => {
  const { email, resetCode, newPassword, confirmPassword } = req.body;

  // basic validation
  if (!email || !resetCode || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: res.__("all_fields_required") });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: res.__("password_too_short") });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: res.__("passwords_do_not_match") });
  }

  // find matching, non-expired code
  const user = await User.findOne({
    email,
    resetCode,
    resetCodeExpires: { $gt: Date.now() },
  });
  if (!user) {
    return res.status(400).json({ message: res.__("invalid_or_expired_code") });
  }

  // update password & clear reset fields
  user.password = await bcrypt.hash(newPassword, 10);
  user.resetCode = undefined;
  user.resetCodeExpires = undefined;
  await user.save();

  res.status(200).json({ message: res.__("password_reset_successful") });
};
