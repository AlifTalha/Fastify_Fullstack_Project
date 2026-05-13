"use strict";

const productService = require("../services/productService");

const productController = {
  async getCatalog(request, reply) {
    const page = parseInt(request.query.page, 10) || 1;
    const limit = Math.min(parseInt(request.query.limit, 10) || 20, 100);
    const result = await productService.getCatalog({ page, limit });
    return reply.send({ success: true, ...result });
  },

  async getCatalogItem(request, reply) {
    const product = await productService.getProductById(request.params.id);
    return reply.send({ success: true, product });
  },

  // Admin routes
  // For simplicity, we assume all admin routes are protected by auth middleware
  async createProduct(request, reply) {
    const fields = {};
    const fileParts = {};

    if (request.isMultipart()) {
      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === "file") {
          fileParts[part.fieldname] = part;
        } else {
          fields[part.fieldname] = part.value;
        }
      }
    } else {
      Object.assign(fields, request.body || {});
    }

    const product = await productService.createProduct({ fields, fileParts });
    return reply.code(201).send({ success: true, product });
  },

  async getAllProducts(request, reply) {
    const page = parseInt(request.query.page, 10) || 1;
    const limit = Math.min(parseInt(request.query.limit, 10) || 20, 100);
    const result = await productService.getAllProducts({ page, limit });
    return reply.send({ success: true, ...result });
  },

  async getProductById(request, reply) {
    const product = await productService.getProductById(request.params.id);
    return reply.send({ success: true, product });
  },

  async updateProduct(request, reply) {
    const fields = {};
    const fileParts = {};

    if (request.isMultipart()) {
      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === "file") {
          fileParts[part.fieldname] = part;
        } else {
          fields[part.fieldname] = part.value;
        }
      }
    } else {
      Object.assign(fields, request.body || {});
    }

    const product = await productService.updateProduct({
      id: request.params.id,
      fields,
      fileParts,
    });
    return reply.send({ success: true, product });
  },

  async deleteProduct(request, reply) {
    await productService.deleteProduct(request.params.id);
    return reply.send({ success: true, message: "Product deleted" });
  },

  async restockProduct(request, reply) {
    const { quantity } = request.body || {};
    if (!quantity) {
      return reply
        .code(400)
        .send({ success: false, message: "quantity is required" });
    }
    const product = await productService.addStock(request.params.id, quantity);
    return reply.send({ success: true, product });
  },
};

module.exports = productController;
