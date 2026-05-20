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

function normalizeImageUrls(urls = []) {
  return [...new Set(urls.map((u) => String(u || "").trim()).filter(Boolean))];
}

function parseImageUrlsField(rawValue) {
  if (rawValue === undefined || rawValue === null) return [];
  const value = String(rawValue).trim();
  if (!value) return [];

  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return normalizeImageUrls(parsed);
    } catch {
      // Fallback to newline/comma parsing below.
    }
  }

  return normalizeImageUrls(value.split(/[\n,]+/));
}

function getProductImages(product) {
  const urls = Array.isArray(product.imageUrls) ? product.imageUrls : [];
  if (urls.length) return normalizeImageUrls(urls);
  return product.imageUrl ? [product.imageUrl] : [];
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

    const imageUrls = parseImageUrlsField(fields.imageUrls);
    if (fields.imageUrl && fields.imageUrl.trim()) {
      imageUrls.push(fields.imageUrl.trim());
    }
    if (fileParts?.image) {
      imageUrls.push(await saveFile(fileParts.image));
    }

    const normalizedImageUrls = normalizeImageUrls(imageUrls);
    const primaryImage = normalizedImageUrls[0] || null;

    return productModel.create({
      name,
      description,
      price: priceInt,
      currency: currency || "usd",
      imageUrl: primaryImage,
      imageUrls: normalizedImageUrls,
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
    let imageUrls = getProductImages(product);
    let hasImageUpdate = false;

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

    if (fields.imageUrls !== undefined) {
      imageUrls = parseImageUrlsField(fields.imageUrls);
      hasImageUpdate = true;
    }

    if (fileParts?.image) {
      imageUrls.push(await saveFile(fileParts.image));
      hasImageUpdate = true;
    }

    if (fields.imageUrl !== undefined && fields.imageUrl.trim() !== "") {
      imageUrls.push(fields.imageUrl.trim());
      hasImageUpdate = true;
    }

    if (fields.removeImageUrls !== undefined) {
      const removeSet = new Set(parseImageUrlsField(fields.removeImageUrls));
      imageUrls = imageUrls.filter((url) => !removeSet.has(url));
      hasImageUpdate = true;
    }

    if (fields.clearImages === "true") {
      imageUrls = [];
      hasImageUpdate = true;
    }

    if (hasImageUpdate) {
      const normalized = normalizeImageUrls(imageUrls);
      data.imageUrls = normalized;
      data.imageUrl = normalized[0] || null;
    }

    return productModel.update(id, data);
  },

  async deleteProductImage({ id, imageUrl }) {
    const product = await productModel.findById(id);
    if (!product) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }

    const targetUrl = String(imageUrl || "").trim();
    if (!targetUrl) {
      const err = new Error("imageUrl is required");
      err.statusCode = 400;
      throw err;
    }

    const imageUrls = getProductImages(product);
    if (!imageUrls.includes(targetUrl)) {
      const err = new Error("Image not found for this product");
      err.statusCode = 404;
      throw err;
    }

    const updatedImages = imageUrls.filter((url) => url !== targetUrl);
    return productModel.update(id, {
      imageUrls: updatedImages,
      imageUrl: updatedImages[0] || null,
    });
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
