const prisma = require("../config/database");

/**
 * Data-access layer — all Prisma calls live here.
 * Passwords are always excluded from SELECT results except when
 * explicitly needed (findByEmail for credential verification).
 */
const userModel = {
  // ── Queries ────────────────────────────────────────────────────────────────

  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /** Returns the full user row INCLUDING password (for credential check only). */
  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findAll({ skip = 0, take = 10, role } = {}) {
    const where = role ? { role } : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);
    return { users, total, page: Math.floor(skip / take) + 1, limit: take };
  },

  // ── Mutations ──────────────────────────────────────────────────────────────

  async create({ email, password, name }) {
    return prisma.user.create({
      data: { email, password, name },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  },

  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });
  },

  async delete(id) {
    return prisma.user.delete({ where: { id } });
  },

  // ── Refresh tokens ─────────────────────────────────────────────────────────

  async saveRefreshToken({ token, userId, expiresAt }) {
    return prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  },

  async findRefreshToken(token) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  },

  async deleteRefreshToken(token) {
    return prisma.refreshToken.delete({ where: { token } });
  },

  async deleteAllUserRefreshTokens(userId) {
    return prisma.refreshToken.deleteMany({ where: { userId } });
  },

  // ── Password reset OTP ─────────────────────────────────────────────────────

  async createPasswordResetOtp({ email, otp, expiresAt }) {
    return prisma.passwordResetOtp.create({ data: { email, otp, expiresAt } });
  },

  async findValidOtp({ email, otp }) {
    return prisma.passwordResetOtp.findFirst({
      where: {
        email,
        otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Mark OTP as verified and store a one-time resetToken. */
  async markOtpVerified(id, resetToken) {
    return prisma.passwordResetOtp.update({
      where: { id },
      data: { used: true, resetToken },
    });
  },

  /** Find a verified (used=true) OTP record by resetToken alone that is not expired. */
  async findByResetToken(resetToken) {
    return prisma.passwordResetOtp.findFirst({
      where: {
        resetToken,
        used: true,
        expiresAt: { gt: new Date() },
      },
    });
  },

  async updateUserPassword({ email, hashedPassword }) {
    return prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
  },

  /** Cleanup: delete all OTPs (used or expired) for an email after reset. */
  async deleteOtpsByEmail(email) {
    return prisma.passwordResetOtp.deleteMany({ where: { email } });
  },
};

module.exports = userModel;
