"use strict";

const path = require("path");
const crypto = require("crypto");
const fs = require("fs/promises");
const productModel = require("../models/productModel");

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "products");

async function saveFile(part) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(part.filename || "") || "";
  const filename = `${crypto.randomUUID()}${ext}`;
  const dest = path.join(UPLOAD_DIR, filename);
  const chunks = [];
  for await (const chunk of part.file) chunks.push(chunk);
  await fs.writeFile(dest, Buffer.concat(chunks));
  return `/uploads/products/${filename}`;
}

const productService = {
  async createProduct({ fields, fileParts }) {
    const { name, description, price, currency, stock } = fields;
    if (!name || !description || !price) {
      const err = new Error("name, description, and price are required");
      err.statusCode = 400;
      throw err;
    }
    const priceInt = parseInt(price, 10);
    if (isNaN(priceInt) || priceInt <= 0) {
      const err = new Error(
        "price must be a positive integer (in cents, e.g. 2999 = $29.99)",
      );
      err.statusCode = 400;
      throw err;
    }

    let imageUrl;
    if (fileParts?.image) {
      imageUrl = await saveFile(fileParts.image);
    } else if (fields.imageUrl && fields.imageUrl.trim()) {
      imageUrl = fields.imageUrl.trim();
    }

    return productModel.create({
      name,
      description,
      price: priceInt,
      currency: currency || "usd",
      imageUrl: imageUrl || null,
      stock: parseInt(stock, 10) || 0,
    });
  },

  async getCatalog({ page, limit }) {
    return productModel.findAll({ isActive: true, page, limit });
  },

  async getAllProducts({ page, limit }) {
    return productModel.findAll({ page, limit });
  },

  async getProductById(id) {
    const product = await productModel.findById(id);
    if (!product) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }
    return product;
  },

  async updateProduct({ id, fields, fileParts }) {
    const product = await productModel.findById(id);
    if (!product) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }

    const data = {};
    if (fields.name) data.name = fields.name;
    if (fields.description) data.description = fields.description;
    if (fields.price) {
      const p = parseInt(fields.price, 10);
      if (isNaN(p) || p <= 0) {
        const err = new Error("price must be a positive integer in cents");
        err.statusCode = 400;
        throw err;
      }
      data.price = p;
    }
    if (fields.currency) data.currency = fields.currency;
    if (fields.stock !== undefined)
      data.stock = parseInt(fields.stock, 10) || 0;
    if (fields.isActive !== undefined)
      data.isActive = fields.isActive === "true";
    if (fileParts?.image) {
      data.imageUrl = await saveFile(fileParts.image);
    } else if (fields.imageUrl !== undefined && fields.imageUrl.trim() !== "") {
      data.imageUrl = fields.imageUrl.trim();
    }

    return productModel.update(id, data);
  },

  async deleteProduct(id) {
    const product = await productModel.findById(id);
    if (!product) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }
    return productModel.delete(id);
  },

  async addStock(id, quantity) {
    const product = await productModel.findById(id);
    if (!product) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      const err = new Error("quantity must be a positive integer");
      err.statusCode = 400;
      throw err;
    }
    return productModel.incrementStock(id, qty);
  },
};

module.exports = productService;
