const userService = require("../services/userService");

const userController = {
  // ── Auth endpoints ─────────────────────────────────────────────────────────

  async register(request, reply) {
    const { email, password, name } = request.body;
    const user = await userService.register({ email, password, name });
    return reply.code(201).send({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  },

  async login(request, reply) {
    const { email, password } = request.body;
    const user = await userService.verifyCredentials({ email, password });

    // Sign short-lived access token
    const accessToken = request.server.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: process.env.JWT_EXPIRES_IN || "60d" },
    );

    const refreshToken = await userService.createRefreshToken(user.id);

    return reply.code(200).send({
      success: true,
      message: "Login successful",
      data: { user, accessToken, refreshToken },
    });
  },

  async refreshToken(request, reply) {
    const { refreshToken } = request.body;
    const user = await userService.validateRefreshToken(refreshToken);

    const accessToken = request.server.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: process.env.JWT_EXPIRES_IN || "60d" },
    );

    return reply.code(200).send({
      success: true,
      data: { accessToken },
    });
  },

  async logout(request, reply) {
    const { refreshToken } = request.body;
    await userService.revokeRefreshToken(refreshToken);
    return reply.code(200).send({
      success: true,
      message: "Logged out successfully",
    });
  },

  async logoutAll(request, reply) {
    await userService.revokeAllUserTokens(request.user.id);
    return reply.code(200).send({
      success: true,
      message: "Logged out from all devices",
    });
  },

  async getMe(request, reply) {
    const user = await userService.getUserById(request.user.id);
    return reply.code(200).send({ success: true, data: user });
  },

  async updateProfile(request, reply) {
    const user = await userService.updateUser(request.user.id, request.body);
    return reply.code(200).send({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  },

  async changePassword(request, reply) {
    const { currentPassword, newPassword } = request.body;
    await userService.changePassword(request.user.id, {
      currentPassword,
      newPassword,
    });
    return reply.code(200).send({
      success: true,
      message: "Password changed successfully",
    });
  },

  // ── User-management endpoints (admin) ─────────────────────────────────────

  async getAllUsers(request, reply) {
    const page = parseInt(request.query.page, 10) || 1;
    const limit = parseInt(request.query.limit, 10) || 10;
    const result = await userService.getAllUsers({ page, limit });
    return reply.code(200).send({ success: true, data: result });
  },

  async getUserById(request, reply) {
    const user = await userService.getUserById(request.params.id);
    return reply.code(200).send({ success: true, data: user });
  },

  async updateUser(request, reply) {
    const user = await userService.updateUser(request.params.id, request.body);
    return reply.code(200).send({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  },

  async deleteUser(request, reply) {
    await userService.deleteUser(request.params.id);
    return reply.code(200).send({
      success: true,
      message: "User deleted successfully",
    });
  },

  // ── Forgot password / OTP reset ────────────────────────────────────────────

  async forgotPassword(request, reply) {
    const { email } = request.body;
    // Always return 200 to prevent email enumeration
    await userService.sendForgotPasswordOtp(email).catch(() => {});
    return reply.code(200).send({
      success: true,
      message:
        "If that email is registered, an OTP has been sent to it. Check your inbox.",
    });
  },

  async verifyOtp(request, reply) {
    const { email, otp } = request.body;
    const resetToken = await userService.verifyOtp({ email, otp });
    return reply.code(200).send({
      success: true,
      message: "OTP verified. Use the resetToken to set a new password.",
      data: { resetToken },
    });
  },

  async resetPassword(request, reply) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.code(401).send({
        success: false,
        message: "Missing or invalid Authorization header",
      });
    }
    const resetToken = authHeader.slice(7).trim();
    const { newPassword } = request.body;
    await userService.resetPassword({ resetToken, newPassword });
    return reply.code(200).send({
      success: true,
      message: "Password has been reset successfully. You can now log in.",
    });
  },
};

module.exports = userController;
