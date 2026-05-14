"use strict";

const orderService = require("../services/orderService");
const generateInvoicePdf = require("../utils/generateInvoicePdf");

function formatOrder(order) {
  return {
    ...order,
    amountFormatted: `${(order.amount / 100).toFixed(2)} ${order.currency.toUpperCase()}`,
  };
}

const orderController = {
  async createOrder(request, reply) {
    const { productId, quantity = 1 } = request.body;
    if (!productId) {
      return reply
        .code(400)
        .send({ success: false, message: "productId is required" });
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return reply.code(400).send({
        success: false,
        message: "quantity must be a positive integer",
      });
    }

    const { order, clientSecret } = await orderService.createOrder({
      userId: request.user.id,
      productId,
      quantity: qty,
    });

    return reply.code(201).send({
      success: true,
      message:
        "Order created. Use clientSecret to confirm payment with Stripe.js or POST /orders/:id/pay for testing.",
      order: formatOrder(order),
      clientSecret,
    });
  },

  async confirmPaymentTest(request, reply) {
    const order = await orderService.confirmPaymentTest({
      orderId: request.params.id,
      userId: request.user.id,
    });
    return reply.send({
      success: true,
      message: "Payment confirmed successfully",
      order: formatOrder(order),
    });
  },

  async verifyPayment(request, reply) {
    const order = await orderService.verifyPayment({
      orderId: request.params.id,
      userId: request.user.id,
      sessionId: request.query.sessionId,
    });
    return reply.send({ success: true, order: formatOrder(order) });
  },

  async createCheckoutSession(request, reply) {
    const { successUrl, cancelUrl } = request.body || {};
    const result = await orderService.createCheckoutSession({
      orderId: request.params.id,
      userId: request.user.id,
      successUrl,
      cancelUrl,
    });
    return reply.send({
      success: true,
      message:
        "Open checkoutUrl in a browser to complete payment. After payment, call POST /orders/:id/verify?sessionId=<sessionId> to confirm.",
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId,
    });
  },

  async getMyOrders(request, reply) {
    const page = parseInt(request.query.page, 10) || 1;
    const limit = Math.min(parseInt(request.query.limit, 10) || 20, 100);
    const result = await orderService.getMyOrders({
      userId: request.user.id,
      page,
      limit,
    });
    return reply.send({
      success: true,
      ...result,
      orders: result.orders.map(formatOrder),
    });
  },

  async getMyOrderById(request, reply) {
    const order = await orderService.getMyOrderById({
      orderId: request.params.id,
      userId: request.user.id,
    });
    return reply.send({ success: true, invoice: formatOrder(order) });
  },

  // Admin
  async getAllOrders(request, reply) {
    const page = parseInt(request.query.page, 10) || 1;
    const limit = Math.min(parseInt(request.query.limit, 10) || 20, 100);
    const { status } = request.query;
    const result = await orderService.getAllOrders({ status, page, limit });
    return reply.send({
      success: true,
      ...result,
      orders: result.orders.map(formatOrder),
    });
  },

  async getOrderByIdAdmin(request, reply) {
    const order = await orderService.getOrderByIdAdmin(request.params.id);
    return reply.send({ success: true, invoice: formatOrder(order) });
  },

  async getSalesStats(request, reply) {
    const stats = await orderService.getSalesStats();
    return reply.send({
      success: true,
      stats: {
        ...stats,
        totalRevenueFormatted: `${Number(stats.totalRevenueCents).toFixed(2)} USD`,
      },
    });
  },

  async downloadInvoice(request, reply) {
    const order = await orderService.getOrderForInvoice({
      orderId: request.params.id,
      userId: request.user.id,
      role: request.user.role,
    });

    const filename = `invoice-${order.invoiceNumber}.pdf`;

    // Collect PDF bytes into a buffer so Fastify can send it normally
    // (avoids reply.hijack() which silently swallows pdfkit errors)
    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = generateInvoicePdf(order);
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      doc.end();
    });

    return reply
      .header("Content-Type", "application/pdf")
      .header("Content-Disposition", `attachment; filename="${filename}"`)
      .header("Content-Length", pdfBuffer.length)
      .send(pdfBuffer);
  },
};

module.exports = orderController;
