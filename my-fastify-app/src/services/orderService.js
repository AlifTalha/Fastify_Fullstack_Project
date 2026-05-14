"use strict";

const Stripe = require("stripe");
const productModel = require("../models/productModel");
const orderModel = require("../models/orderModel");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const orderService = {
  /**
   * Create a Stripe PaymentIntent and an Order record in PENDING status.
   * Returns { order, clientSecret } for the client to confirm payment.
   */
  async createOrder({ userId, productId, quantity }) {
    const product = await productModel.findById(productId);
    if (!product) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }
    if (!product.isActive) {
      const err = new Error("Product is not available");
      err.statusCode = 400;
      throw err;
    }
    if (product.stock < quantity) {
      const err = new Error(`Insufficient stock. Available: ${product.stock}`);
      err.statusCode = 400;
      throw err;
    }

    const amount = product.price * quantity;
    const currency = product.currency;

    // Stripe always expects amounts in cents
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency,
      metadata: { userId, productId, quantity: String(quantity) },
      // Required so pm_card_visa works in test without a return_url
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    });

    const order = await orderModel.create({
      userId,
      productId,
      quantity,
      amount,
      currency,
      stripePaymentIntentId: paymentIntent.id,
    });

    return { order, clientSecret: paymentIntent.client_secret };
  },

  /**
   * Confirm payment using a Stripe test payment method (pm_card_visa).
   * Only for Postman / development testing — not needed in production
   * where the client confirms via Stripe.js.
   */
  async confirmPaymentTest({ orderId, userId }) {
    const order = await orderModel.findById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }
    if (order.userId !== userId) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      throw err;
    }
    if (order.status !== "PENDING") {
      const err = new Error(`Order is already ${order.status}`);
      err.statusCode = 400;
      throw err;
    }

    // Attach test payment method and confirm
    const pi = await stripe.paymentIntents.confirm(
      order.stripePaymentIntentId,
      {
        payment_method: "pm_card_visa",
      },
    );

    if (pi.status === "succeeded") {
      const updatedOrder = await orderModel.updateStatus(orderId, "PAID");
      await productModel.decrementStock(order.productId, order.quantity);
      return updatedOrder;
    }

    // Surface Stripe's error if not succeeded
    const err = new Error(
      `Payment failed: ${pi.last_payment_error?.message || pi.status}`,
    );
    err.statusCode = 402;
    throw err;
  },

  /**
   * Create a Stripe Checkout Session for an existing order.
   * Returns a hosted Stripe payment URL the user opens in the browser.
   * After payment, call POST /orders/:id/verify?sessionId=xxx to sync status.
   */
  async createCheckoutSession({ orderId, userId, successUrl, cancelUrl }) {
    const order = await orderModel.findById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }
    if (order.userId !== userId) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      throw err;
    }
    if (order.status !== "PENDING") {
      const err = new Error(`Order is already ${order.status}`);
      err.statusCode = 400;
      throw err;
    }

    const baseSuccess =
      successUrl ||
      process.env.STRIPE_SUCCESS_URL ||
      "http://localhost:5000/payment-success";
    const baseCancel =
      cancelUrl ||
      process.env.STRIPE_CANCEL_URL ||
      "http://localhost:5000/payment-cancel";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: order.currency,
            // Stripe requires amount in cents; price is stored as dollars
            unit_amount: order.product.price * 100,
            product_data: {
              name: order.product.name,
              description: order.product.description || undefined,
            },
          },
          quantity: order.quantity,
        },
      ],
      metadata: { orderId: order.id },
      // {CHECKOUT_SESSION_ID} is replaced by Stripe automatically on redirect
      success_url: `${baseSuccess}?orderId=${order.id}&sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseCancel}?orderId=${order.id}`,
    });

    return { checkoutUrl: session.url, sessionId: session.id };
  },

  /**
   * Called by GET /payment-success redirect from Stripe.
   * No auth required — session authenticity is verified with Stripe directly.
   */
  async verifyBySession({ orderId, sessionId }) {
    const order = await orderModel.findById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }
    if (order.status === "PAID") return order;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Extra safety: confirm session belongs to this order
    if (session.metadata?.orderId !== orderId) {
      const err = new Error("Session does not match order");
      err.statusCode = 400;
      throw err;
    }

    if (session.payment_status === "paid") {
      const updated = await orderModel.updateStatus(orderId, "PAID");
      await productModel.decrementStock(order.productId, order.quantity);
      return updated;
    }

    return { ...order, stripeStatus: session.payment_status };
  },

  /**
   * Authenticated verify — called by POST /orders/:id/verify
   */
  async verifyPayment({ orderId, userId, sessionId }) {
    const order = await orderModel.findById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }
    if (order.userId !== userId) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      throw err;
    }
    if (order.status === "PAID") {
      return order;
    }

    // Production: verify via Stripe Checkout Session
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        const updated = await orderModel.updateStatus(orderId, "PAID");
        await productModel.decrementStock(order.productId, order.quantity);
        return updated;
      }
      return { ...order, stripeStatus: session.payment_status };
    }

    // Test flow: verify via PaymentIntent
    if (order.stripePaymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(
        order.stripePaymentIntentId,
      );
      if (pi.status === "succeeded") {
        const updated = await orderModel.updateStatus(orderId, "PAID");
        await productModel.decrementStock(order.productId, order.quantity);
        return updated;
      }
      if (pi.status === "payment_failed") {
        return orderModel.updateStatus(orderId, "FAILED");
      }
      return { ...order, stripeStatus: pi.status };
    }

    return order;
  },

  async getMyOrders({ userId, page, limit }) {
    return orderModel.findMyOrders({ userId, page, limit });
  },

  async getMyOrderById({ orderId, userId }) {
    const order = await orderModel.findById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }
    if (order.userId !== userId) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      throw err;
    }
    return order;
  },

  async getAllOrders({ status, page, limit }) {
    return orderModel.findAllOrders({ status, page, limit });
  },

  async getOrderByIdAdmin(orderId) {
    const order = await orderModel.findById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }
    return order;
  },

  async getSalesStats() {
    return orderModel.getSalesStats();
  },

  async getOrderForInvoice({ orderId, userId, role }) {
    const order = await orderModel.findById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }
    // Users can only download their own; admins can download any
    if (role !== "ADMIN" && order.userId !== userId) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      throw err;
    }
    return order;
  },
};

module.exports = orderService;
