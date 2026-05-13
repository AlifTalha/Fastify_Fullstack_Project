require("dotenv").config();

const path = require("path");
const fastify = require("fastify");
const cors = require("@fastify/cors");
const helmet = require("@fastify/helmet");
const rateLimit = require("@fastify/rate-limit");
const websocket = require("@fastify/websocket");
const multipart = require("@fastify/multipart");
const staticFiles = require("@fastify/static");

const { loggerConfig } = require("./config/server");
const authPlugin = require("./plugins/authPlugin");
const routes = require("./routes/index");
const errorHandler = require("./errorHandler/errorHandler");

function buildApp(opts = {}) {
  const app = fastify({ logger: loggerConfig, ...opts });

  app.register(helmet, { global: true });

  app.register(cors, {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  });

  // app.register(rateLimit, {
  //   max: 100,
  //   timeWindow: "1 minute",
  //   errorResponseBuilder: () => ({
  //     success: false,
  //     message: "Too many requests, please try again later",
  //   }),
  // });

  // ── WebSocket ────────────────────────────────────────────────────────────
  app.register(websocket);

  // ── File uploads (max 50 MB) ───────────────────────────────────────────────
  app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });

  // ── Serve uploaded files at /uploads/* ────────────────────────────────────
  app.register(staticFiles, {
    root: path.join(process.cwd(), "uploads"),
    prefix: "/uploads/",
    decorateReply: false,
  });

  // ── Custom plugins ─────────────────────────────────────────────────────────
  app.register(authPlugin);

  // ── Routes ─────────────────────────────────────────────────────────────────
  app.register(routes, { prefix: "/api" });

  // ── Stripe payment redirect handlers (no auth, open routes) ───────────────
  const paymentRedirectRoutes = require("./routes/paymentRedirectRoutes");
  app.register(paymentRedirectRoutes);

  // ── Root ───────────────────────────────────────────────────────────────────
  app.get("/", async () => ({
    success: true,
    message: "Welcome to my-fastify-app API",
    version: "1.0.0",
    docs: {
      health: "/health",
      api: "/api/v1",
      auth: {
        register: "POST /api/v1/auth/register",
        login: "POST /api/v1/auth/login",
        refresh: "POST /api/v1/auth/refresh",
        logout: "POST /api/v1/auth/logout",
        me: "GET /api/v1/auth/me",
      },
      chat: {
        userRoom: "GET /api/v1/chat/room",
        userMessages: "GET /api/v1/chat/room/messages",
        userWebSocket: "WS ws://localhost:5000/api/v1/chat/ws",
        adminRooms: "GET /api/v1/chat/rooms",
        adminWebSocket: "WS ws://localhost:5000/api/v1/chat/admin/ws/:roomId",
      },
    },
  }));

  // ── Health check ───────────────────────────────────────────────────────────
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // ── Error handler ──────────────────────────────────────────────────────────
  app.setErrorHandler(errorHandler);

  return app;
}

module.exports = buildApp;
