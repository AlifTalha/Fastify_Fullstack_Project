"use strict";

const orderService = require("../services/orderService");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * These routes handle Stripe Checkout redirects.
 * They are NOT authenticated — Stripe sends the user here after payment.
 * Security is ensured by verifying the sessionId against Stripe's API.
 */
module.exports = async function paymentRedirectRoutes(fastify) {
  // Stripe redirects here after successful payment.
  // URL: /payment-success?orderId=xxx&sessionId=cs_test_xxx
  fastify.get("/payment-success", async (request, reply) => {
    const { orderId, sessionId } = request.query;

    if (!orderId || !sessionId) {
      return reply.redirect(`${FRONTEND_URL}/orders`);
    }

    try {
      await orderService.verifyBySession({ orderId, sessionId });
    } catch {
      // Even if verify fails, redirect to order page — status will reflect reality
    }

    // Redirect to the frontend order detail page with a success flag
    return reply.redirect(302, `${FRONTEND_URL}/orders/${orderId}?paid=1`);
  });

  // Stripe redirects here if the user cancels payment.
  fastify.get("/payment-cancel", async (request, reply) => {
    const { orderId } = request.query;
    if (orderId) {
      return reply.redirect(
        302,
        `${FRONTEND_URL}/orders/${orderId}?cancelled=1`,
      );
    }
    return reply.redirect(302, `${FRONTEND_URL}/orders`);
  });
};
