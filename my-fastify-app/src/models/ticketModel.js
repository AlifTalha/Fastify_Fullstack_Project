"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ticketModel = {
  // Create a new ticket
  async create({ userId, subject, description, priority }) {
    return prisma.ticket.create({
      data: { userId, subject, description, priority },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  },

  // Get all tickets (admin) with optional filters
  async findAll({ status, priority, page = 1, limit = 20 } = {}) {
    const baseWhere = {};
    if (priority) baseWhere.priority = priority;

    const where = { ...baseWhere };
    if (status) where.status = status;

    const skip = (Math.max(page, 1) - 1) * limit;
    const [
      total,
      tickets,
      totalAll,
      openCount,
      inProgressCount,
      resolvedCount,
      closedCount,
    ] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.ticket.count({ where: baseWhere }),
      prisma.ticket.count({ where: { ...baseWhere, status: "OPEN" } }),
      prisma.ticket.count({ where: { ...baseWhere, status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { ...baseWhere, status: "RESOLVED" } }),
      prisma.ticket.count({ where: { ...baseWhere, status: "CLOSED" } }),
    ]);

    return {
      total,
      tickets,
      statusCounts: {
        ALL: totalAll,
        OPEN: openCount,
        IN_PROGRESS: inProgressCount,
        RESOLVED: resolvedCount,
        CLOSED: closedCount,
      },
    };
  },

  // Get tickets for a specific user
  async findByUser({ userId, status, page = 1, limit = 20 }) {
    const where = { userId };
    if (status) where.status = status;
    const skip = (Math.max(page, 1) - 1) * limit;
    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return { total, tickets };
  },

  // Get a single ticket by id
  async findById(id) {
    return prisma.ticket.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  },

  // Update ticket status (admin)
  async updateStatus(id, status) {
    return prisma.ticket.update({
      where: { id },
      data: { status },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  },

  // Add a reply into the Json replies array, optionally update status
  async addReply(id, reply, status) {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return null;
    const replies = Array.isArray(ticket.replies) ? ticket.replies : [];
    replies.push(reply);
    const data = { replies };
    if (status) data.status = status;
    return prisma.ticket.update({
      where: { id },
      data,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  },

  // Delete a ticket
  async delete(id) {
    return prisma.ticket.delete({ where: { id } });
  },
};

module.exports = ticketModel;
