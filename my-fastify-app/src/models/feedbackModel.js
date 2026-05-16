"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const FEEDBACK_SELECT = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  user: { select: { id: true, name: true } },
};

const feedbackModel = {
  async findByProduct(productId) {
    return prisma.productFeedback.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      select: FEEDBACK_SELECT,
    });
  },

  async findByUser(productId, userId) {
    return prisma.productFeedback.findUnique({
      where: { productId_userId: { productId, userId } },
      select: FEEDBACK_SELECT,
    });
  },

  async create({ productId, userId, rating, comment }) {
    return prisma.productFeedback.create({
      data: { productId, userId, rating, comment },
      select: FEEDBACK_SELECT,
    });
  },

  async delete(id) {
    return prisma.productFeedback.delete({ where: { id } });
  },

  async findAll({ page = 1, limit = 20 } = {}) {
    const skip = (Math.max(page, 1) - 1) * limit;
    const [total, feedbacks] = await Promise.all([
      prisma.productFeedback.count(),
      prisma.productFeedback.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          ...FEEDBACK_SELECT,
          product: { select: { id: true, name: true } },
        },
      }),
    ]);
    return { total, feedbacks };
  },

  async getStats(productId) {
    const result = await prisma.productFeedback.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { id: true },
    });
    return {
      average: result._avg.rating ? Number(result._avg.rating.toFixed(1)) : 0,
      count: result._count.id,
    };
  },
};

module.exports = feedbackModel;
