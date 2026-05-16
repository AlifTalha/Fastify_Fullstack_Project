"use strict";

const feedbackModel = require("../models/feedbackModel");
const productModel = require("../models/productModel");

const feedbackController = {
  // GET /shop/catalog/:id/feedback - public
  async getProductFeedback(request, reply) {
    const { id: productId } = request.params;

    const [feedbacks, stats] = await Promise.all([
      feedbackModel.findByProduct(productId),
      feedbackModel.getStats(productId),
    ]);

    return reply.send({ success: true, data: { feedbacks, stats } });
  },

  // POST /shop/catalog/:id/feedback - authenticated users
  async submitFeedback(request, reply) {
    const { id: productId } = request.params;
    const { rating, comment } = request.body;
    const userId = request.user.id;

    const ratingNum = parseInt(rating, 10);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return reply
        .code(400)
        .send({ success: false, message: "Rating must be between 1 and 5" });
    }

    if (!comment || !comment.trim()) {
      return reply
        .code(400)
        .send({ success: false, message: "Comment is required" });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return reply
        .code(404)
        .send({ success: false, message: "Product not found" });
    }

    const existing = await feedbackModel.findByUser(productId, userId);
    if (existing) {
      return reply.code(409).send({
        success: false,
        message: "You have already submitted feedback for this product",
      });
    }

    const feedback = await feedbackModel.create({
      productId,
      userId,
      rating: ratingNum,
      comment: comment.trim(),
    });

    return reply.code(201).send({ success: true, data: feedback });
  },

  // DELETE /shop/feedback/:id - admin only
  async deleteFeedback(request, reply) {
    const { id } = request.params;
    await feedbackModel.delete(id);
    return reply.send({ success: true, message: "Feedback deleted" });
  },

  // GET /shop/admin/feedback - admin only
  async getAllFeedback(request, reply) {
    const page = parseInt(request.query.page, 10) || 1;
    const limit = Math.min(parseInt(request.query.limit, 10) || 20, 100);
    const result = await feedbackModel.findAll({ page, limit });
    return reply.send({ success: true, ...result });
  },
};

module.exports = feedbackController;
