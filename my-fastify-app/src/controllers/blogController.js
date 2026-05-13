"use strict";

const blogService = require("../services/blogService");

const blogController = {
  // ── Public (no auth) ───────────────────────────────────────────────────────

  async getPublicPosts(request, reply) {
    const { category, page = 1, limit = 10 } = request.query;
    const result = await blogService.getPublicPosts({
      category,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    return reply.code(200).send({ success: true, ...result });
  },

  async getPublicPostBySlug(request, reply) {
    const post = await blogService.getPublicPostBySlug(request.params.slug);
    return reply.code(200).send({ success: true, data: post });
  },

  // ── User: create post (multipart) ──────────────────────────────────────────

  async createPost(request, reply) {
    const fields = {};
    const fileParts = {};

    for await (const part of request.parts()) {
      if (part.type === "file") {
        if (part.fieldname === "image") fileParts.image = part;
        else if (part.fieldname === "pdf") fileParts.pdf = part;
        else await part.file.resume(); // discard unknown files
      } else {
        fields[part.fieldname] = part.value;
      }
    }

    const post = await blogService.createPost({
      userId: request.user.id,
      fields,
      fileParts,
    });
    return reply.code(201).send({ success: true, data: post });
  },

  // ── User: list my posts ────────────────────────────────────────────────────

  async getMyPosts(request, reply) {
    const { page = 1, limit = 10 } = request.query;
    const result = await blogService.getMyPosts({
      userId: request.user.id,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    return reply.code(200).send({ success: true, ...result });
  },

  // ── User/Admin: update post (multipart) ───────────────────────────────────

  async updatePost(request, reply) {
    const fields = {};
    const fileParts = {};

    for await (const part of request.parts()) {
      if (part.type === "file") {
        if (part.fieldname === "image") fileParts.image = part;
        else if (part.fieldname === "pdf") fileParts.pdf = part;
        else await part.file.resume();
      } else {
        fields[part.fieldname] = part.value;
      }
    }

    const post = await blogService.updatePost({
      postId: request.params.id,
      userId: request.user.id,
      role: request.user.role,
      fields,
      fileParts,
    });
    return reply.code(200).send({ success: true, data: post });
  },

  // ── User/Admin: delete post ────────────────────────────────────────────────

  async deletePost(request, reply) {
    await blogService.deletePost({
      postId: request.params.id,
      userId: request.user.id,
      role: request.user.role,
    });
    return reply.code(200).send({ success: true, message: "Post deleted" });
  },

  async getBlogStats(request, reply) {
    const stats = await blogService.getBlogStats();
    return reply.code(200).send({ success: true, data: stats });
  },

  async getAllPosts(request, reply) {
    const { status, category, page = 1, limit = 10 } = request.query;
    const result = await blogService.getAllPosts({
      status,
      category,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    return reply.code(200).send({ success: true, ...result });
  },

  // ── Admin: update post status (APPROVED / REJECTED) ──────────────────────

  async updatePostStatus(request, reply) {
    const { status } = request.body;
    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return reply.code(400).send({
        success: false,
        message: "status must be APPROVED or REJECTED",
      });
    }
    const post = await blogService.setPostStatus(request.params.id, status);
    return reply.code(200).send({ success: true, data: post });
  },

  // ── Comments ───────────────────────────────────────────────────────────────

  async addComment(request, reply) {
    const { content } = request.body;
    const comment = await blogService.addComment({
      postId: request.params.id,
      userId: request.user.id,
      content,
    });
    return reply.code(201).send({ success: true, data: comment });
  },

  async editComment(request, reply) {
    const { content } = request.body;
    const comment = await blogService.editComment({
      commentId: request.params.commentId,
      userId: request.user.id,
      role: request.user.role,
      content,
    });
    return reply.code(200).send({ success: true, data: comment });
  },

  async deleteComment(request, reply) {
    await blogService.deleteComment({
      commentId: request.params.commentId,
      userId: request.user.id,
      role: request.user.role,
    });
    return reply.code(200).send({ success: true, message: "Comment deleted" });
  },
};

module.exports = blogController;
