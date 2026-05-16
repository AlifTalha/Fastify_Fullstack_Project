"use strict";

const chatService = require("../services/chatService");

const chatController = {
  // ── REST ───────────────────────────────────────────────────────────────────

  /** POST /conversations  { receiverId } */
  async startOrGetConversation(request, reply) {
    const { receiverId } = request.body;
    if (!receiverId) {
      return reply
        .code(400)
        .send({ success: false, message: "receiverId is required" });
    }
    const conv = await chatService.startOrGetConversation(
      request.user.id,
      receiverId,
    );
    return reply.code(200).send({ success: true, data: conv });
  },

  /** GET /conversations */
  async getConversations(request, reply) {
    const list = await chatService.getConversations(request.user.id);
    return reply.code(200).send({ success: true, data: list });
  },

  /** GET /conversations/:id?page=1&limit=50 */
  async getConversationMessages(request, reply) {
    const page = parseInt(request.query.page, 10) || 1;
    const limit = parseInt(request.query.limit, 10) || 50;
    const messages = await chatService.getMessages(
      request.params.id,
      request.user.id,
      { page, limit },
    );
    return reply.code(200).send({ success: true, data: messages });
  },

  async sendMessage(request, reply) {
    const conversationId = request.params.id;
    let content, mediaUrl, mediaType;

    if (request.isMultipart()) {
      for await (const part of request.parts()) {
        if (part.type === "file" && part.fieldname === "media") {
          ({ mediaUrl, mediaType } = await chatService.saveUpload(part));
        } else if (part.type === "field" && part.fieldname === "content") {
          content = part.value;
        }
      }
    } else {
      content = request.body?.content;
    }

    if (!content && !mediaUrl) {
      return reply
        .code(400)
        .send({ success: false, message: "content or media is required" });
    }

    const msg = await chatService.sendMessage({
      conversationId,
      senderId: request.user.id,
      content,
      mediaUrl,
      mediaType,
    });
    return reply.code(201).send({ success: true, data: msg });
  },

  /** PUT /conversations/:id/read */
  async markAsRead(request, reply) {
    await chatService.markAsRead(request.params.id, request.user.id);
    return reply
      .code(200)
      .send({ success: true, message: "Messages marked as read" });
  },

  /** POST /upload  — multipart with any file field */
  async uploadMedia(request, reply) {
    let result;
    for await (const part of request.parts()) {
      if (part.type === "file") {
        result = await chatService.saveUpload(part);
        break;
      }
    }
    if (!result) {
      return reply
        .code(400)
        .send({ success: false, message: "No file uploaded" });
    }
    return reply.code(200).send({ success: true, data: result });
  },

  /** GET /users — returns all users (except self) for starting conversations */
  async getChatUsers(request, reply) {
    const users = await chatService.getChatUsers(request.user.id);
    return reply.code(200).send({ success: true, data: users });
  },

  /** GET /admin-user — returns the first admin user (authenticated users) */
  async getAdminUser(request, reply) {
    const admin = await chatService.getAdminUser();
    return reply.code(200).send({ success: true, data: admin });
  },

  /** GET /admin/conversations — returns all conversations (admin only) */
  async getAllConversationsAdmin(request, reply) {
    const convs = await chatService.getAllConversations();
    return reply.code(200).send({ success: true, data: convs });
  },

  // ── WebSocket ──────────────────────────────────────────────────────────────

  /**
   * ws://localhost:5000/api/v1/chat/ws
   * First frame: { "event": "auth", "token": "<accessToken>" }
   * Send message: { "event": "message", "data": { "conversationId": "...", "content": "..." } }
   */
  async wsHandler(connection, request) {
    const { socket } = connection;
    let userId = null;
    let authenticated = false;

    socket.on("message", async (rawData) => {
      let parsed;
      try {
        parsed = JSON.parse(rawData.toString());
      } catch {
        return socket.send(
          JSON.stringify({ event: "error", data: { message: "Invalid JSON" } }),
        );
      }

      // ── Auth handshake ─────────────────────────────────────────────────────
      if (!authenticated) {
        if (parsed.event !== "auth" || !parsed.token) {
          return socket.send(
            JSON.stringify({
              event: "error",
              data: { message: "Send { event: 'auth', token } first" },
            }),
          );
        }
        try {
          const user = request.server.jwt.verify(parsed.token);
          userId = user.id;
          chatService.addConnection(userId, socket);
          authenticated = true;
          socket.send(
            JSON.stringify({ event: "authenticated", data: { userId } }),
          );
        } catch {
          socket.send(
            JSON.stringify({
              event: "error",
              data: { message: "Authentication failed" },
            }),
          );
          return socket.close();
        }
        return;
      }

      // ── Send message ───────────────────────────────────────────────────────
      if (parsed.event === "message") {
        const { conversationId, content } = parsed.data || {};
        try {
          await chatService.sendMessage({
            conversationId,
            senderId: userId,
            content,
          });
        } catch (err) {
          socket.send(
            JSON.stringify({ event: "error", data: { message: err.message } }),
          );
        }
      }
    });

    socket.on("close", () => {
      if (userId) chatService.removeConnection(userId, socket);
    });
  },
};

module.exports = chatController;
