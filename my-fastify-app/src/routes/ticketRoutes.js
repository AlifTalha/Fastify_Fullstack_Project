"use strict";

const ticketController = require("../controllers/ticketController");

/**
 * Ticket routes — mounted at /api/v1/tickets
 *
 * User routes (authenticate):
 *   POST   /                — create a ticket
 *   GET    /my              — list my tickets  (?status=OPEN&page=1&limit=20)
 *   GET    /my/:id          — get my ticket by id
 *   POST   /:id/reply       — add a reply to a ticket (user on own, admin on any)
 *
 * Admin routes (authorizeAdmin):
 *   GET    /                — list all tickets (?status=&priority=&page=&limit=)
 *   GET    /:id             — get any ticket by id
 *   PATCH  /:id/status      — update ticket status
 *   DELETE /:id             — delete a ticket
 */
async function ticketRoutes(fastify) {
  // ── User ───────────────────────────────────────────────────────────────────
  fastify.post(
    "/",
    { preHandler: [fastify.authenticate] },
    ticketController.createTicket,
  );

  fastify.get(
    "/my",
    { preHandler: [fastify.authenticate] },
    ticketController.getMyTickets,
  );

  fastify.get(
    "/my/:id",
    { preHandler: [fastify.authenticate] },
    ticketController.getMyTicket,
  );

  fastify.post(
    "/:id/reply",
    { preHandler: [fastify.authenticate] },
    ticketController.addReply,
  );

  // ── Admin ──────────────────────────────────────────────────────────────────
  fastify.get(
    "/",
    { preHandler: [fastify.authorizeAdmin] },
    ticketController.getAllTickets,
  );

  fastify.get(
    "/:id",
    { preHandler: [fastify.authorizeAdmin] },
    ticketController.getTicketById,
  );

  fastify.delete(
    "/:id",
    { preHandler: [fastify.authorizeAdmin] },
    ticketController.deleteTicket,
  );
}

module.exports = ticketRoutes;
