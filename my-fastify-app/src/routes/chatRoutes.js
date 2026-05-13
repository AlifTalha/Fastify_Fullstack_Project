"use strict";

const chatController = require("../controllers/chatController");

/**
 * Chat routes — mounted at /api/v1/chat
 *
 * REST:
 *   POST /conversations            — start or get existing conversation
 *   GET  /conversations            — list my conversations
 *   GET  /conversations/:id        — get messages in a conversation
 *   POST /conversations/:id        — send message (JSON or multipart with media)
 *   PUT  /conversations/:id/read   — mark messages as read
 *   POST /upload                   — upload a file, get back { mediaUrl, mediaType }
 *
 * WebSocket:
 *   WS /ws                         — real-time connection (all users)
 */
async function chatRoutes(fastify) {
  // ── REST ───────────────────────────────────────────────────────────────────
  fastify.post(
    "/conversations",
    { preHandler: [fastify.authenticate] },
    chatController.startOrGetConversation,
  );
  fastify.get(
    "/conversations",
    { preHandler: [fastify.authenticate] },
    chatController.getConversations,
  );
  fastify.get(
    "/conversations/:id",
    { preHandler: [fastify.authenticate] },
    chatController.getConversationMessages,
  );
  fastify.post(
    "/conversations/:id",
    { preHandler: [fastify.authenticate] },
    chatController.sendMessage,
  );
  fastify.put(
    "/conversations/:id/read",
    { preHandler: [fastify.authenticate] },
    chatController.markAsRead,
  );
  fastify.post(
    "/upload",
    { preHandler: [fastify.authenticate] },
    chatController.uploadMedia,
  );

  // ── WebSocket ──────────────────────────────────────────────────────────────
  fastify.get("/ws", { websocket: true }, chatController.wsHandler);
}

module.exports = chatRoutes;
