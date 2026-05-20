"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PRODUCT_SELECT = {
  id: true,
  name: true,
  description: true,
  price: true,
  currency: true,
  imageUrl: true,
  imageUrls: true,
  stock: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

const productModel = {
  async create({
    name,
    description,
    price,
    currency,
    imageUrl,
    imageUrls,
    stock,
  }) {
    return prisma.product.create({
      data: {
        name,
        description,
        price,
        currency,
        imageUrl,
        imageUrls,
        stock,
      },
      select: PRODUCT_SELECT,
    });
  },

  async findAll({ isActive, page = 1, limit = 20 } = {}) {
    const where = {};
    if (isActive !== undefined) where.isActive = isActive;
    const skip = (Math.max(page, 1) - 1) * limit;
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: PRODUCT_SELECT,
      }),
    ]);
    return { total, products };
  },

  async findById(id) {
    return prisma.product.findUnique({ where: { id }, select: PRODUCT_SELECT });
  },

  async update(id, data) {
    return prisma.product.update({
      where: { id },
      data,
      select: PRODUCT_SELECT,
    });
  },

  async delete(id) {
    return prisma.product.delete({ where: { id } });
  },

  async decrementStock(id, qty) {
    return prisma.product.update({
      where: { id },
      data: { stock: { decrement: qty } },
    });
  },

  async incrementStock(id, qty) {
    return prisma.product.update({
      where: { id },
      data: { stock: { increment: qty } },
      select: PRODUCT_SELECT,
    });
  },
};

module.exports = productModel;
