"use strict";

const prisma = require("../config/database");

const chatModel = {
  // ── Conversations ──────────────────────────────────────────────────────────

  async findConversationBetween(user1Id, user2Id) {
    return prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: user1Id } } },
          { participants: { some: { userId: user2Id } } },
        ],
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
  },

  async createConversation(user1Id, user2Id) {
    return prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: user1Id }, { userId: user2Id }],
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
  },

  async findMyConversations(userId) {
    return prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { updatedAt: "desc" },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            mediaType: true,
            isRead: true,
            senderId: true,
            createdAt: true,
          },
        },
      },
    });
  },

  async findConversationById(id) {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
  },

  async isParticipant(conversationId, userId) {
    const p = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    return !!p;
  },

  // ── Messages ───────────────────────────────────────────────────────────────

  async getMessages(conversationId, { skip = 0, take = 50 } = {}) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      skip,
      take,
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async createMessage({
    conversationId,
    senderId,
    receiverId,
    content,
    mediaUrl,
    mediaType,
  }) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId,
        content,
        mediaUrl,
        mediaType,
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async markAsRead(conversationId, userId) {
    return prisma.message.updateMany({
      where: { conversationId, receiverId: userId, isRead: false },
      data: { isRead: true },
    });
  },

  async findFirstAdmin() {
    return prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, name: true, email: true },
    });
  },

  async findAllConversations() {
    return prisma.conversation.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            mediaType: true,
            isRead: true,
            senderId: true,
            createdAt: true,
          },
        },
      },
    });
  },

  async countUnread(conversationId, userId) {
    return prisma.message.count({
      where: { conversationId, receiverId: userId, isRead: false },
    });
  },
};

module.exports = chatModel;
