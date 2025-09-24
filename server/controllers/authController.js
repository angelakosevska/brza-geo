const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const { sendPasswordResetEmail, sendWelcomeEmail } = require("../utils/email");

// ========== REGISTER ==========
/**
 * POST /api/auth/register
 * Register a new user account
 */
exports.register = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // 1. Validate inputs
  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: res.__("all_fields_required") });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: res.__("invalid_email") });
  }
  if (
    !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
    })
  ) {
    return res.status(400).json({ message: res.__("password_not_strong") });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: res.__("passwords_do_not_match") });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Ensure username/email are unique
    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: username.trim() }],
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: res.__("username_or_email_taken") });
    }

    // 3. Hash password
    const hash = await bcrypt.hash(password, 10);

    // 4. Assign role (admin if matches ENV var, otherwise "player")
    const role =
      normalizedEmail === process.env.ADMIN_EMAIL?.toLowerCase()
        ? "admin"
        : "player";

    // 5. Create user
    const newUser = await User.create({
      username: username.trim(),
      email: normalizedEmail,
      password: hash,
      role,
    });

    // 6. Try to send welcome email (non-blocking)
    try {
      await sendWelcomeEmail(newUser);
    } catch (err) {
      console.warn("📭 Failed to send welcome email:", err.message);
    }

    // 7. Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("❌ Registration Error:", err);
    return res.status(500).json({ message: res.__("registration_failed") });
  }
};

// ========== LOGIN ==========
/**
 * POST /api/auth/login
 * Login with username or email
 */
exports.login = async (req, res) => {
  try {
    const { login, password } = req.body;

    // 1. Validate inputs
    if (!login || !password) {
      return res.status(400).json({ message: res.__("all_fields_required") });
    }

    // 2. Check if login is email or username
    const normalizedLogin = login.trim();
    const isEmail = validator.isEmail(normalizedLogin);
    const query = isEmail
      ? { email: normalizedLogin.toLowerCase() }
      : { username: normalizedLogin };

    // 3. Find user
    const user = await User.findOne(query).select("+password");
    if (!user) {
      return res.status(401).json({ message: res.__("login_failed") });
    }

    // 4. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: res.__("login_failed") });
    }

    // 5. Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: res.__("server_error") });
  }
};

// ========== REQUEST RESET ==========
/**
 * POST /api/auth/request-reset
 * Request a password reset code via email
 */
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ message: res.__("invalid_email") });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(404).json({ message: res.__("user_not_found") });
  }

  // Generate 6-digit reset code (valid 15 min)
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = resetCode;
  user.resetCodeExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  try {
    await sendPasswordResetEmail(user, resetCode);
    res.status(200).json({ message: res.__("reset_email_sent") });
  } catch (err) {
    console.error("📭 Failed to send reset code:", err);
    res.status(500).json({ message: res.__("email_send_failed") });
  }
};

// ========== RESET PASSWORD ==========
/**
 * POST /api/auth/reset-password
 * Reset password using a reset code
 */
exports.resetPassword = async (req, res) => {
  const { email, resetCode, newPassword, confirmPassword } = req.body;

  // 1. Validate inputs
  if (!email || !resetCode || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: res.__("all_fields_required") });
  }
  if (
    !validator.isStrongPassword(newPassword, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
    })
  ) {
    return res.status(400).json({ message: res.__("password_not_strong") });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: res.__("passwords_do_not_match") });
  }

  // 2. Find user with valid reset code
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({
    email: normalizedEmail,
    resetCode,
    resetCodeExpires: { $gt: Date.now() }, // must not be expired
  });
  if (!user) {
    return res.status(400).json({ message: res.__("invalid_or_expired_code") });
  }

  // 3. Update password
  user.password = await bcrypt.hash(newPassword, 10);
  user.resetCode = undefined;
  user.resetCodeExpires = undefined;
  await user.save();

  res.status(200).json({ message: res.__("password_reset_successful") });
};
