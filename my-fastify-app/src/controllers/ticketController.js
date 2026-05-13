"use strict";

const ticketService = require("../services/ticketService");

const ticketController = {
  // ── User: create ticket ────────────────────────────────────────────────────
  async createTicket(request, reply) {
    const { subject, description, priority } = request.body;
    if (!subject || !description) {
      return reply.code(400).send({
        success: false,
        message: "subject and description are required",
      });
    }
    const ticket = await ticketService.createTicket({
      userId: request.user.id,
      subject,
      description,
      priority,
    });
    return reply.code(201).send({ success: true, data: ticket });
  },

  // ── User: list my tickets ──────────────────────────────────────────────────
  async getMyTickets(request, reply) {
    const { status, page = 1, limit = 20 } = request.query;
    const result = await ticketService.getMyTickets({
      userId: request.user.id,
      status,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    return reply.code(200).send({ success: true, ...result });
  },

  // ── User: get my single ticket ─────────────────────────────────────────────
  async getMyTicket(request, reply) {
    const ticket = await ticketService.getMyTicketById({
      userId: request.user.id,
      ticketId: request.params.id,
    });
    return reply.code(200).send({ success: true, data: ticket });
  },

  // ── Shared: add reply (user on own ticket, admin on any)
  //           admin can optionally pass status to change it in the same call
  async addReply(request, reply) {
    const { message, status } = request.body;
    if (!message) {
      return reply
        .code(400)
        .send({ success: false, message: "message is required" });
    }
    const ticket = await ticketService.addReply({
      ticketId: request.params.id,
      userId: request.user.id,
      userName: request.user.name || null,
      role: request.user.role,
      message,
      status,
    });
    return reply.code(200).send({ success: true, data: ticket });
  },

  // ── Admin: list all tickets ────────────────────────────────────────────────
  async getAllTickets(request, reply) {
    const { status, priority, page = 1, limit = 20 } = request.query;
    const result = await ticketService.getAllTickets({
      status,
      priority,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    return reply.code(200).send({ success: true, ...result });
  },

  // ── Admin: get any ticket by id ────────────────────────────────────────────
  async getTicketById(request, reply) {
    const ticket = await ticketService.getTicketById(request.params.id);
    return reply.code(200).send({ success: true, data: ticket });
  },

  // ── Admin: delete ticket ───────────────────────────────────────────────────
  async deleteTicket(request, reply) {
    await ticketService.deleteTicket(request.params.id);
    return reply.code(200).send({ success: true, message: "Ticket deleted" });
  },
};

module.exports = ticketController;
