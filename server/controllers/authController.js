const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const { sendPasswordResetEmail, sendWelcomeEmail } = require("../utils/email");
const crypto = require("crypto");

// REGISTER
exports.register = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

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
      minSymbols:0,
    })
  ) {
    return res.status(400).json({ message: res.__("password_not_strong") });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: res.__("passwords_do_not_match") });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: username.trim() }],
    });
    if (existing) {
      return res.status(400).json({ message: res.__("username_or_email_taken") });
    }

    const hash = await bcrypt.hash(password, 10);

    const role =
      normalizedEmail === process.env.ADMIN_EMAIL?.toLowerCase()
        ? "admin"
        : "player";

    const newUser = await User.create({
      username: username.trim(),
      email: normalizedEmail,
      password: hash,
      role,
    });

    try {
      await sendWelcomeEmail(newUser);
    } catch (err) {
      console.warn("Failed to send welcome email:", err.message);
    }

    const sessionId = crypto.randomUUID();
    newUser.currentSessionId = sessionId;
    newUser.lastLoginAt = new Date();
    await newUser.save();

    const token = jwt.sign(
      {
        userId: newUser._id,
        username: newUser.username,
        role: newUser.role,
        sid: sessionId,
      },
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
    console.error("Registration Error:", err);
    return res.status(500).json({ message: res.__("registration_failed") });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ message: res.__("all_fields_required") });
    }

    const normalizedLogin = login.trim();
    const isEmail = validator.isEmail(normalizedLogin);
    const query = isEmail
      ? { email: normalizedLogin.toLowerCase() }
      : { username: normalizedLogin };

    const user = await User.findOne(query).select("+password");
    if (!user) {
      return res.status(401).json({ message: res.__("login_failed") });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: res.__("login_failed") });
    }

    const sessionId = crypto.randomUUID();
    user.currentSessionId = sessionId;
    user.lastLoginAt = new Date();
    await user.save();

    const { getIO } = require("../sockets/ioInstance");
    const io = getIO();

    io.to(user._id.toString()).emit("forceLogout", {
      reason: "Signed in elsewhere",
    });
    io.in(user._id.toString()).disconnectSockets(true);

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
        sid: sessionId,
      },
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
    console.error("Login Error:", err);
    return res.status(500).json({ message: res.__("server_error") });
  }
};

// REQUEST PASSWORD RESET
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

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = resetCode;
  user.resetCodeExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  try {
    await sendPasswordResetEmail(user, resetCode);
    res.status(200).json({ message: res.__("reset_email_sent") });
  } catch (err) {
    console.error("Failed to send reset code:", err);
    res.status(500).json({ message: res.__("email_send_failed") });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  const { email, resetCode, newPassword, confirmPassword } = req.body;

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

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({
    email: normalizedEmail,
    resetCode,
    resetCodeExpires: { $gt: Date.now() },
  });
  if (!user) {
    return res.status(400).json({ message: res.__("invalid_or_expired_code") });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetCode = undefined;
  user.resetCodeExpires = undefined;
  await user.save();

  res.status(200).json({ message: res.__("password_reset_successful") });
};

// LOGOUT
exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;
    const sid = req.user.sid;

    await User.updateOne(
      { _id: userId, currentSessionId: sid },
      { $set: { currentSessionId: null } }
    );

    return res.status(200).json({ message: "Logout successful." });
  } catch (err) {
    console.error("Logout Error:", err);
    return res.status(500).json({ message: "Logout failed." });
  }
};
