"use strict";

const orderService = require("../services/orderService");

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
      return reply.code(400).send({
        success: false,
        message: "orderId and sessionId are required",
      });
    }

    const order = await orderService.verifyBySession({ orderId, sessionId });

    return reply.send({
      success: true,
      message:
        order.status === "PAID"
          ? "Payment successful! Your order has been confirmed."
          : "Payment is still being processed.",
      order: {
        id: order.id,
        invoiceNumber: order.invoiceNumber,
        status: order.status,
        amount: order.amount,
        amountFormatted: `${(order.amount / 100).toFixed(2)} ${order.currency?.toUpperCase()}`,
        stripeStatus: order.stripeStatus,
      },
    });
  });

  // Stripe redirects here if the user cancels payment.
  fastify.get("/payment-cancel", async (request, reply) => {
    const { orderId } = request.query;
    return reply.send({
      success: false,
      message: "Payment was cancelled. Your order is still pending.",
      orderId: orderId || null,
    });
  });
};
