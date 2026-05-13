"use strict";

const userController = require("../controllers/userController");
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  updateUserSchema,
  paginationSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require("../middlewares/validation");

/**
 * All user + auth routes.
 * Mounted at /api/v1 (see routes/index.js).
 *
 * Public:
 *   POST /auth/register
 *   POST /auth/login
 *   POST /auth/refresh
 *   POST /auth/logout
 *
 * Authenticated (any role):
 *   GET  /auth/me
 *   POST /auth/logout-all
 *
 * Admin only:
 *   GET    /users
 *   GET    /users/:id
 *   PUT    /users/:id
 *   DELETE /users/:id
 */
async function userRoutes(fastify) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  fastify.post(
    "/auth/register",
    { schema: registerSchema },
    userController.register,
  );
  fastify.post("/auth/login", { schema: loginSchema }, userController.login);
  fastify.post(
    "/auth/refresh",
    { schema: refreshTokenSchema },
    userController.refreshToken,
  );
  fastify.post("/auth/logout", { schema: logoutSchema }, userController.logout);

  // ── Forgot password (OTP flow) ─────────────────────────────────────────────
  fastify.post(
    "/auth/forgot-password",
    { schema: forgotPasswordSchema },
    userController.forgotPassword,
  );

  fastify.post(
    "/auth/verify-otp",
    { schema: verifyOtpSchema },
    userController.verifyOtp,
  );

  fastify.post(
    "/auth/reset-password",
    { schema: resetPasswordSchema },
    userController.resetPassword,
  );

  fastify.post(
    "/auth/logout-all",
    { preHandler: [fastify.authenticate] },
    userController.logoutAll,
  );

  fastify.get(
    "/auth/me",
    { preHandler: [fastify.authenticate] },
    userController.getMe,
  );

  fastify.put(
    "/auth/profile",
    { preHandler: [fastify.authenticate], schema: updateProfileSchema },
    userController.updateProfile,
  );

  fastify.put(
    "/auth/change-password",
    { preHandler: [fastify.authenticate], schema: changePasswordSchema },
    userController.changePassword,
  );

  // ── User management (admin) ────────────────────────────────────────────────
  fastify.get(
    "/users",
    { preHandler: [fastify.authorizeAdmin], schema: paginationSchema },
    userController.getAllUsers,
  );

  fastify.get(
    "/users/:id",
    { preHandler: [fastify.authorizeAdmin] },
    userController.getUserById,
  );

  fastify.put(
    "/users/:id",
    { preHandler: [fastify.authorizeAdmin], schema: updateUserSchema },
    userController.updateUser,
  );

  fastify.delete(
    "/users/:id",
    { preHandler: [fastify.authorizeAdmin] },
    userController.deleteUser,
  );
}

module.exports = userRoutes;
