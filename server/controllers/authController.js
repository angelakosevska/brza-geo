const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../utils/email");

exports.register = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // 1. Validate presence of all fields
  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: res.__("all_fields_required") });
  }

  // 2. Validate email format
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: res.__("invalid_email") });
  }

  // 3. Validate password length
  if (password.length < 6) {
    return res.status(400).json({ message: res.__("password_too_short") });
  }

  // 4. Validate password confirmation
  if (password !== confirmPassword) {
    return res.status(400).json({ message: res.__("passwords_do_not_match") });
  }

  try {
    // 5. Check if username or email is taken
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res
        .status(400)
        .json({ message: res.__("username_or_email_taken") });
    }

    // 6. Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    try {
      await require("../utils/email").sendWelcomeEmail(newUser);
    } catch (err) {
      console.warn("📭 Failed to send welcome email:", err.message);
    }

    // 7. Create JWT
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // 8. Respond with success
    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("❌ Registration Error:", err);
    res.status(500).json({ message: res.__("registration_failed") });
  }
};

exports.login = async (req, res) => {
  const { login, password } = req.body;

  // 1. Check presence
  if (!login || !password) {
    return res.status(400).json({ message: res.__("all_fields_required") });
  }

  // 2. Determine if login is email or username
  const isEmail = validator.isEmail(login);
  const user = await User.findOne(
    isEmail ? { email: login } : { username: login }
  );

  if (!user) {
    return res.status(400).json({ message: res.__("login_failed") });
  }

  // 3. Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: res.__("login_failed") });
  }

  // 4. Create JWT
  const token = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  // 5. Return user data
  res.status(200).json({
    token,
    user: { id: user._id, username: user.username, email: user.email },
  });
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
