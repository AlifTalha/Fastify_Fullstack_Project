"use strict";

const crypto = require("crypto");
const path = require("path");
const fs = require("fs/promises");
const blogModel = require("../models/blogModel");

const VALID_CATEGORIES = [
  "TECHNOLOGY",
  "HEALTH",
  "EDUCATION",
  "BUSINESS",
  "LIFESTYLE",
  "TRAVEL",
  "FOOD",
  "SPORTS",
  "ENTERTAINMENT",
  "OTHER",
];
const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"];
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "blog");

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function uniqueSlug(title) {
  let base = slugify(title);
  let slug = base;
  let i = 1;
  while (await blogModel.slugExists(slug)) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

async function saveFile(part) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(part.filename || "") || "";
  const filename = `${crypto.randomUUID()}${ext}`;
  const dest = path.join(UPLOAD_DIR, filename);
  const chunks = [];
  for await (const chunk of part.file) chunks.push(chunk);
  await fs.writeFile(dest, Buffer.concat(chunks));
  return `/uploads/blog/${filename}`;
}

const blogService = {
  // ── Public ─────────────────────────────────────────────────────────────────

  async getPublicPosts({ category, page, limit }) {
    if (category && !VALID_CATEGORIES.includes(category)) {
      const err = new Error(
        `Invalid category. Valid: ${VALID_CATEGORIES.join(", ")}`,
      );
      err.statusCode = 400;
      throw err;
    }
    return blogModel.findPublicPosts({ category, page, limit });
  },

  async getPublicPostBySlug(slug) {
    const post = await blogModel.findPostBySlug(slug);
    if (!post || post.status !== "APPROVED") {
      const err = new Error("Post not found");
      err.statusCode = 404;
      throw err;
    }
    return post;
  },

  // ── User ───────────────────────────────────────────────────────────────────

  async createPost({ userId, fields, fileParts }) {
    const { title, content, category, videoLink } = fields;
    if (!title || !content) {
      const err = new Error("title and content are required");
      err.statusCode = 400;
      throw err;
    }
    if (category && !VALID_CATEGORIES.includes(category)) {
      const err = new Error(
        `Invalid category. Valid: ${VALID_CATEGORIES.join(", ")}`,
      );
      err.statusCode = 400;
      throw err;
    }

    let imageUrl, pdfUrl;
    if (fileParts) {
      if (fileParts.image) imageUrl = await saveFile(fileParts.image);
      if (fileParts.pdf) pdfUrl = await saveFile(fileParts.pdf);
    }

    const slug = await uniqueSlug(title);
    return blogModel.createPost({
      userId,
      title,
      slug,
      content,
      category: category || "OTHER",
      imageUrl: imageUrl || null,
      pdfUrl: pdfUrl || null,
      videoLink: videoLink || null,
    });
  },

  async getMyPosts({ userId, page, limit }) {
    return blogModel.findMyPosts({ userId, page, limit });
  },

  async updatePost({ postId, userId, role, fields, fileParts }) {
    const post = await blogModel.findPostById(postId);
    if (!post) {
      const err = new Error("Post not found");
      err.statusCode = 404;
      throw err;
    }
    if (role !== "ADMIN" && post.user.id !== userId) {
      const err = new Error("Access denied");
      err.statusCode = 403;
      throw err;
    }

    const data = {};
    if (fields.title) {
      data.title = fields.title;
      data.slug = await uniqueSlug(fields.title);
    }
    if (fields.content) data.content = fields.content;
    if (fields.category) {
      if (!VALID_CATEGORIES.includes(fields.category)) {
        const err = new Error(
          `Invalid category. Valid: ${VALID_CATEGORIES.join(", ")}`,
        );
        err.statusCode = 400;
        throw err;
      }
      data.category = fields.category;
    }
    if (fields.videoLink !== undefined)
      data.videoLink = fields.videoLink || null;

    if (fileParts) {
      if (fileParts.image) data.imageUrl = await saveFile(fileParts.image);
      if (fileParts.pdf) data.pdfUrl = await saveFile(fileParts.pdf);
    }

    // Non-admin edits reset status to PENDING for re-approval
    if (role !== "ADMIN" && Object.keys(data).length > 0) {
      data.status = "PENDING";
    }

    return blogModel.updatePost(postId, data);
  },

  async deletePost({ postId, userId, role }) {
    const post = await blogModel.findPostById(postId);
    if (!post) {
      const err = new Error("Post not found");
      err.statusCode = 404;
      throw err;
    }
    if (role !== "ADMIN" && post.user.id !== userId) {
      const err = new Error("Access denied");
      err.statusCode = 403;
      throw err;
    }
    return blogModel.deletePost(postId);
  },

  // ── Admin ──────────────────────────────────────────────────────────────────

  async getBlogStats() {
    return blogModel.getStats();
  },

  async getAllPosts({ status, category, page, limit }) {
    if (status && !VALID_STATUSES.includes(status)) {
      const err = new Error(
        `Invalid status. Valid: ${VALID_STATUSES.join(", ")}`,
      );
      err.statusCode = 400;
      throw err;
    }
    if (category && !VALID_CATEGORIES.includes(category)) {
      const err = new Error(
        `Invalid category. Valid: ${VALID_CATEGORIES.join(", ")}`,
      );
      err.statusCode = 400;
      throw err;
    }
    return blogModel.findAllPosts({ status, category, page, limit });
  },

  async setPostStatus(postId, status) {
    const post = await blogModel.findPostById(postId);
    if (!post) {
      const err = new Error("Post not found");
      err.statusCode = 404;
      throw err;
    }
    return blogModel.updatePost(postId, { status });
  },

  // ── Comments ───────────────────────────────────────────────────────────────

  async addComment({ postId, userId, content }) {
    if (!content) {
      const err = new Error("content is required");
      err.statusCode = 400;
      throw err;
    }
    // only approved posts can receive comments
    const post = await blogModel.findPostById(postId);
    if (!post || post.status !== "APPROVED") {
      const err = new Error("Post not found");
      err.statusCode = 404;
      throw err;
    }
    return blogModel.createComment({ postId, userId, content });
  },

  async editComment({ commentId, userId, role, content }) {
    if (!content) {
      const err = new Error("content is required");
      err.statusCode = 400;
      throw err;
    }
    const comment = await blogModel.findCommentById(commentId);
    if (!comment) {
      const err = new Error("Comment not found");
      err.statusCode = 404;
      throw err;
    }
    if (role !== "ADMIN" && comment.userId !== userId) {
      const err = new Error("Access denied");
      err.statusCode = 403;
      throw err;
    }
    return blogModel.updateComment(commentId, content);
  },

  async deleteComment({ commentId, userId, role }) {
    const comment = await blogModel.findCommentById(commentId);
    if (!comment) {
      const err = new Error("Comment not found");
      err.statusCode = 404;
      throw err;
    }
    if (role !== "ADMIN" && comment.userId !== userId) {
      const err = new Error("Access denied");
      err.statusCode = 403;
      throw err;
    }
    return blogModel.deleteComment(commentId);
  },
};

module.exports = blogService;
