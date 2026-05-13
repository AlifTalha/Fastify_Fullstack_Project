const bcrypt = require("bcryptjs");
const { sendOtpEmail } = require("../utils/email");
const crypto = require("crypto");
const userModel = require("../models/userModel");

const SALT_ROUNDS = 12;

const userService = {
  // ── Auth ───────────────────────────────────────────────────────────────────

  async register({ email, password, name }) {
    const existing = await userModel.findByEmail(email);
    if (existing) {
      const err = new Error("Email is already registered");
      err.statusCode = 409;
      throw err;
    }
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    return userModel.create({ email, password: hashed, name });
  },

  /**
   * Verifies email + password, returns safe user object (no password).
   * Throws 401 on any mismatch (deliberately vague to prevent enumeration).
   */
  async verifyCredentials({ email, password }) {
    const user = await userModel.findByEmail(email);
    const passwordValid = user
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!user || !passwordValid) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      throw err;
    }
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  },

  // ── Refresh tokens ─────────────────────────────────────────────────────────

  /** Generates a cryptographically random opaque refresh token and persists it. */
  async createRefreshToken(userId) {
    const token = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await userModel.saveRefreshToken({ token, userId, expiresAt });
    return token;
  },

  /**
   * Validates the refresh token against the database.
   * Returns the safe user object on success, throws 401 on failure.
   */
  async validateRefreshToken(token) {
    const stored = await userModel.findRefreshToken(token);
    if (!stored) {
      const err = new Error("Invalid refresh token");
      err.statusCode = 401;
      throw err;
    }
    if (stored.expiresAt < new Date()) {
      await userModel.deleteRefreshToken(token).catch(() => {});
      const err = new Error("Refresh token has expired, please log in again");
      err.statusCode = 401;
      throw err;
    }
    const { user } = stored;
    return { id: user.id, email: user.email, role: user.role };
  },

  async revokeRefreshToken(token) {
    await userModel.deleteRefreshToken(token).catch(() => {});
  },

  async revokeAllUserTokens(userId) {
    return userModel.deleteAllUserRefreshTokens(userId);
  },

  // ── User CRUD ──────────────────────────────────────────────────────────────

  async getUserById(id) {
    const user = await userModel.findById(id);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    return user;
  },

  async getAllUsers({ page = 1, limit = 10 } = {}) {
    const skip = (Math.max(page, 1) - 1) * limit;
    return userModel.findAll({ skip, take: limit, role: "USER" });
  },

  async updateUser(id, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    }
    return userModel.update(id, data);
  },

  async deleteUser(id) {
    return userModel.delete(id);
  },

  // ── Forgot password / OTP reset ────────────────────────────────────────────

  /**
   * Generates a 6-digit OTP, stores it in DB (10-min expiry), and emails it.
   * Always responds the same way even if email is not found (prevents enumeration).
   */
  async sendForgotPasswordOtp(email) {
    const user = await userModel.findByEmail(email);
    if (!user) return; // silent — don't reveal whether email exists

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await userModel.createPasswordResetOtp({ email, otp, expiresAt });
    await sendOtpEmail(email, otp);
  },

  /**
   * Step 2 — Verify the OTP.
   * Returns a short-lived resetToken the client must send to /reset-password.
   * Throws 400 on invalid/expired OTP.
   */
  async verifyOtp({ email, otp }) {
    const record = await userModel.findValidOtp({ email, otp });
    if (!record) {
      const err = new Error("Invalid or expired OTP");
      err.statusCode = 400;
      throw err;
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    await userModel.markOtpVerified(record.id, resetToken);
    return resetToken;
  },

  /**
   * Step 3 — Change the password using the resetToken from step 2.
   * Throws 400 if resetToken is invalid or expired.
   */
  async resetPassword({ resetToken, newPassword }) {
    const record = await userModel.findByResetToken(resetToken);
    if (!record) {
      const err = new Error("Invalid or expired reset token");
      err.statusCode = 400;
      throw err;
    }
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await Promise.all([
      userModel.updateUserPassword({ email: record.email, hashedPassword }),
      userModel.deleteOtpsByEmail(record.email),
    ]);
  },

  async changePassword(id, { currentPassword, newPassword }) {
    const user = await userModel.findById(id);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    // findById excludes password — re-fetch with password
    const fullUser = await userModel.findByEmail(user.email);
    const valid = await bcrypt.compare(currentPassword, fullUser.password);
    if (!valid) {
      const err = new Error("Current password is incorrect");
      err.statusCode = 400;
      throw err;
    }
    if (currentPassword === newPassword) {
      const err = new Error("New password must differ from current password");
      err.statusCode = 400;
      throw err;
    }
    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userModel.update(id, { password: hashed });
  },
};

module.exports = userService;
