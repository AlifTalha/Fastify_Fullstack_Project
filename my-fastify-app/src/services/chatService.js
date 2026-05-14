"use strict";

const path = require("path");
const crypto = require("crypto");
const fs = require("fs/promises");
const chatModel = require("../models/chatModel");

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// In-memory WebSocket registry: { [userId]: Set<WebSocket> }
const onlineUsers = {};

function pushToUser(userId, payload) {
  const sockets = onlineUsers[userId];
  if (!sockets) return;
  const data = JSON.stringify(payload);
  for (const ws of sockets) {
    if (ws.readyState === 1) ws.send(data);
  }
}

const chatService = {
  // ── Conversations ──────────────────────────────────────────────────────────

  async startOrGetConversation(meId, receiverId) {
    if (meId === receiverId) {
      const err = new Error("Cannot start a conversation with yourself");
      err.statusCode = 400;
      throw err;
    }
    let conv = await chatModel.findConversationBetween(meId, receiverId);
    if (!conv) conv = await chatModel.createConversation(meId, receiverId);
    return conv;
  },

  async getConversations(userId) {
    return chatModel.findMyConversations(userId);
  },

  async getMessages(conversationId, userId, { page = 1, limit = 50 } = {}) {
    const ok = await chatModel.isParticipant(conversationId, userId);
    if (!ok) {
      const err = new Error("Access denied");
      err.statusCode = 403;
      throw err;
    }
    const skip = (Math.max(page, 1) - 1) * limit;
    return chatModel.getMessages(conversationId, { skip, take: limit });
  },

  async sendMessage({
    conversationId,
    senderId,
    content,
    mediaUrl,
    mediaType,
  }) {
    const conv = await chatModel.findConversationById(conversationId);
    if (!conv) {
      const err = new Error("Conversation not found");
      err.statusCode = 404;
      throw err;
    }
    const ok = await chatModel.isParticipant(conversationId, senderId);
    if (!ok) {
      const err = new Error("Access denied");
      err.statusCode = 403;
      throw err;
    }
    const receiverId = conv.participants.find(
      (p) => p.userId !== senderId,
    )?.userId;
    if (!receiverId) {
      const err = new Error("Receiver not found");
      err.statusCode = 400;
      throw err;
    }
    const msg = await chatModel.createMessage({
      conversationId,
      senderId,
      receiverId,
      content,
      mediaUrl,
      mediaType,
    });

    // Real-time push to both parties
    pushToUser(receiverId, { event: "message", data: msg });
    pushToUser(senderId, { event: "message", data: msg });

    return msg;
  },

  async markAsRead(conversationId, userId) {
    const ok = await chatModel.isParticipant(conversationId, userId);
    if (!ok) {
      const err = new Error("Access denied");
      err.statusCode = 403;
      throw err;
    }
    return chatModel.markAsRead(conversationId, userId);
  },

  // ── File upload ────────────────────────────────────────────────────────────

  async saveUpload(part) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const ext = path.extname(part.filename || "") || "";
    const filename = `${crypto.randomUUID()}${ext}`;
    const dest = path.join(UPLOAD_DIR, filename);
    const chunks = [];
    for await (const chunk of part.file) chunks.push(chunk);
    await fs.writeFile(dest, Buffer.concat(chunks));
    const mime = part.mimetype || "";
    const mediaType = mime.startsWith("image/")
      ? "image"
      : mime.startsWith("video/")
        ? "video"
        : "file";
    return { mediaUrl: `/uploads/${filename}`, mediaType };
  },

  // ── WebSocket connection management ────────────────────────────────────────

  addConnection(userId, ws) {
    if (!onlineUsers[userId]) onlineUsers[userId] = new Set();
    onlineUsers[userId].add(ws);
  },

  removeConnection(userId, ws) {
    if (onlineUsers[userId]) {
      onlineUsers[userId].delete(ws);
      if (onlineUsers[userId].size === 0) delete onlineUsers[userId];
    }
  },

  isOnline(userId) {
    return !!(onlineUsers[userId] && onlineUsers[userId].size > 0);
  },

  async getAdminUser() {
    const admin = await chatModel.findFirstAdmin();
    if (!admin) {
      const err = new Error("No admin user found");
      err.statusCode = 404;
      throw err;
    }
    return admin;
  },

  async getAllConversations() {
    return chatModel.findAllConversations();
  },
};

module.exports = chatService;
