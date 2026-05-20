"use strict";

const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController");
const feedbackController = require("../controllers/feedbackController");

module.exports = async function shopRoutes(fastify) {
  // ─── Public: Product Catalog ─────────────────────────────────────────────
  fastify.get("/catalog", productController.getCatalog);
  fastify.get("/catalog/:id", productController.getCatalogItem);

  // ─── Public / Authenticated: Product Feedback ────────────────────────────
  fastify.get("/catalog/:id/feedback", feedbackController.getProductFeedback);
  fastify.post(
    "/catalog/:id/feedback",
    { preHandler: [fastify.authenticate] },
    feedbackController.submitFeedback,
  );

  // ─── Admin: Feedback Management ──────────────────────────────────────────
  fastify.delete(
    "/feedback/:id",
    { preHandler: [fastify.authorizeAdmin] },
    feedbackController.deleteFeedback,
  );
  fastify.get(
    "/admin/feedback",
    { preHandler: [fastify.authorizeAdmin] },
    feedbackController.getAllFeedback,
  );

  // ─── Admin: Product Management ───────────────────────────────────────────
  fastify.post(
    "/products",
    { preHandler: [fastify.authorizeAdmin] },
    productController.createProduct,
  );
  fastify.get(
    "/products",
    { preHandler: [fastify.authorizeAdmin] },
    productController.getAllProducts,
  );
  fastify.get(
    "/products/:id",
    { preHandler: [fastify.authorizeAdmin] },
    productController.getProductById,
  );
  fastify.put(
    "/products/:id",
    { preHandler: [fastify.authorizeAdmin] },
    productController.updateProduct,
  );
  fastify.delete(
    "/products/:id",
    { preHandler: [fastify.authorizeAdmin] },
    productController.deleteProduct,
  );
  fastify.delete(
    "/products/:id/images",
    { preHandler: [fastify.authorizeAdmin] },
    productController.deleteProductImage,
  );
  // PATCH /products/:id/restock — add stock quantity
  fastify.patch(
    "/products/:id/restock",
    { preHandler: [fastify.authorizeAdmin] },
    productController.restockProduct,
  );

  // ─── Admin: Order Management & Sales Stats ───────────────────────────────
  fastify.get(
    "/admin/orders",
    { preHandler: [fastify.authorizeAdmin] },
    orderController.getAllOrders,
  );
  fastify.get(
    "/admin/orders/stats",
    { preHandler: [fastify.authorizeAdmin] },
    orderController.getSalesStats,
  );
  fastify.get(
    "/admin/orders/:id",
    { preHandler: [fastify.authorizeAdmin] },
    orderController.getOrderByIdAdmin,
  );

  // ─── Authenticated Users: Orders ─────────────────────────────────────────
  fastify.post(
    "/orders",
    { preHandler: [fastify.authenticate] },
    orderController.createOrder,
  );
  // POST /orders/:id/pay — test-only endpoint to confirm payment with pm_card_visa
  fastify.post(
    "/orders/:id/pay",
    { preHandler: [fastify.authenticate] },
    orderController.confirmPaymentTest,
  );
  // POST /orders/:id/checkout-session — get a Stripe-hosted payment URL (production)
  fastify.post(
    "/orders/:id/checkout-session",
    { preHandler: [fastify.authenticate] },
    orderController.createCheckoutSession,
  ); // POST /orders/:id/verify — production endpoint: checks PaymentIntent status from Stripe
  // Call this after Stripe.js confirms payment on the frontend (no webhook needed)
  fastify.post(
    "/orders/:id/verify",
    { preHandler: [fastify.authenticate] },
    orderController.verifyPayment,
  );
  fastify.get(
    "/orders/my",
    { preHandler: [fastify.authenticate] },
    orderController.getMyOrders,
  );
  fastify.get(
    "/orders/my/:id",
    { preHandler: [fastify.authenticate] },
    orderController.getMyOrderById,
  );
  fastify.post(
    "/orders/:id/cancel",
    { preHandler: [fastify.authenticate] },
    orderController.cancelMyOrder,
  );
  // GET /orders/:id/invoice — download PDF invoice (users: own orders only; admins: any order)
  fastify.get(
    "/orders/:id/invoice",
    { preHandler: [fastify.authenticate] },
    orderController.downloadInvoice,
  );
};
