"use strict";

const ticketModel = require("../models/ticketModel");

const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const ticketService = {
  // ── User actions ───────────────────────────────────────────────────────────

  async createTicket({ userId, subject, description, priority }) {
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      const err = new Error(
        `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}`,
      );
      err.statusCode = 400;
      throw err;
    }
    return ticketModel.create({
      userId,
      subject,
      description,
      priority: priority || "MEDIUM",
    });
  },

  async getMyTickets({ userId, status, page, limit }) {
    if (status && !VALID_STATUSES.includes(status)) {
      const err = new Error(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      );
      err.statusCode = 400;
      throw err;
    }
    return ticketModel.findByUser({ userId, status, page, limit });
  },

  async getMyTicketById({ userId, ticketId }) {
    const ticket = await ticketModel.findById(ticketId);
    if (!ticket) {
      const err = new Error("Ticket not found");
      err.statusCode = 404;
      throw err;
    }
    if (ticket.userId !== userId) {
      const err = new Error("Access denied");
      err.statusCode = 403;
      throw err;
    }
    return ticket;
  },

  // ── Admin actions ──────────────────────────────────────────────────────────

  async getAllTickets({ status, priority, page, limit }) {
    if (status && !VALID_STATUSES.includes(status)) {
      const err = new Error(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      );
      err.statusCode = 400;
      throw err;
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      const err = new Error(
        `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}`,
      );
      err.statusCode = 400;
      throw err;
    }
    return ticketModel.findAll({ status, priority, page, limit });
  },

  async getTicketById(ticketId) {
    const ticket = await ticketModel.findById(ticketId);
    if (!ticket) {
      const err = new Error("Ticket not found");
      err.statusCode = 404;
      throw err;
    }
    return ticket;
  },

  async updateStatus({ ticketId, status }) {
    if (!VALID_STATUSES.includes(status)) {
      const err = new Error(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      );
      err.statusCode = 400;
      throw err;
    }
    const ticket = await ticketModel.findById(ticketId);
    if (!ticket) {
      const err = new Error("Ticket not found");
      err.statusCode = 404;
      throw err;
    }
    return ticketModel.updateStatus(ticketId, status);
  },

  async addReply({ ticketId, userId, userName, role, message, status }) {
    const ticket = await ticketModel.findById(ticketId);
    if (!ticket) {
      const err = new Error("Ticket not found");
      err.statusCode = 404;
      throw err;
    }
    // Users can only reply to their own tickets; admins can reply to any
    if (role !== "ADMIN" && ticket.userId !== userId) {
      const err = new Error("Access denied");
      err.statusCode = 403;
      throw err;
    }
    // Only admins can change status via reply
    let resolvedStatus;
    if (status) {
      if (role !== "ADMIN") {
        const err = new Error("Only admins can change ticket status");
        err.statusCode = 403;
        throw err;
      }
      if (!VALID_STATUSES.includes(status)) {
        const err = new Error(
          `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        );
        err.statusCode = 400;
        throw err;
      }
      resolvedStatus = status;
    }
    const reply = {
      id: require("crypto").randomUUID(),
      userId,
      userName: userName || null,
      role,
      message,
      createdAt: new Date().toISOString(),
    };
    return ticketModel.addReply(ticketId, reply, resolvedStatus);
  },

  async deleteTicket(ticketId) {
    const ticket = await ticketModel.findById(ticketId);
    if (!ticket) {
      const err = new Error("Ticket not found");
      err.statusCode = 404;
      throw err;
    }
    return ticketModel.delete(ticketId);
  },
};

module.exports = ticketService;
