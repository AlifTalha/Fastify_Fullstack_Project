"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ORDER_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
  product: {
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      currency: true,
      imageUrl: true,
    },
  },
};

function generateInvoiceNumber() {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 900000 + 100000);
  return `INV-${ymd}-${rand}`;
}

const orderModel = {
  async create({
    userId,
    productId,
    quantity,
    amount,
    currency,
    stripePaymentIntentId,
  }) {
    return prisma.order.create({
      data: {
        userId,
        productId,
        quantity,
        amount,
        currency,
        stripePaymentIntentId,
        invoiceNumber: generateInvoiceNumber(),
      },
      include: ORDER_INCLUDE,
    });
  },

  async findById(id) {
    return prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
  },

  async findMyOrders({ userId, page = 1, limit = 20 }) {
    const skip = (Math.max(page, 1) - 1) * limit;
    const [total, orders] = await Promise.all([
      prisma.order.count({ where: { userId } }),
      prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: ORDER_INCLUDE,
      }),
    ]);
    return { total, orders };
  },

  async findAllOrders({ status, page = 1, limit = 20 }) {
    const where = {};
    if (status) where.status = status;
    const skip = (Math.max(page, 1) - 1) * limit;
    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: ORDER_INCLUDE,
      }),
    ]);
    return { total, orders };
  },

  async updateStatus(id, status) {
    return prisma.order.update({
      where: { id },
      data: { status },
      include: ORDER_INCLUDE,
    });
  },

  async getSalesStats() {
    const [total, paid, pending, revenue, recentOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: ORDER_INCLUDE,
      }),
    ]);
    return {
      totalOrders: total,
      paidOrders: paid,
      pendingOrders: pending,
      totalRevenueCents: revenue._sum.amount || 0,
      recentOrders,
    };
  },
};

module.exports = orderModel;
