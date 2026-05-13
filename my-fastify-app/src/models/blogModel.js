"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const POST_SELECT = {
  id: true,
  title: true,
  slug: true,
  content: true,
  category: true,
  imageUrl: true,
  pdfUrl: true,
  videoLink: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, email: true } },
};

const blogModel = {
  // ── Posts ──────────────────────────────────────────────────────────────────

  async createPost({
    userId,
    title,
    slug,
    content,
    category,
    imageUrl,
    pdfUrl,
    videoLink,
  }) {
    return prisma.blogPost.create({
      data: {
        userId,
        title,
        slug,
        content,
        category,
        imageUrl,
        pdfUrl,
        videoLink,
      },
      select: POST_SELECT,
    });
  },

  async findPublicPosts({ category, page = 1, limit = 10 }) {
    const where = { status: "APPROVED" };
    if (category) where.category = category;
    const skip = (Math.max(page, 1) - 1) * limit;
    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          imageUrl: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
      }),
    ]);
    return { total, posts };
  },

  async findPostBySlug(slug) {
    return prisma.blogPost.findUnique({
      where: { slug },
      select: {
        ...POST_SELECT,
        comments: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    });
  },

  async findPostById(id) {
    return prisma.blogPost.findUnique({ where: { id }, select: POST_SELECT });
  },

  async findMyPosts({ userId, page = 1, limit = 10 }) {
    const skip = (Math.max(page, 1) - 1) * limit;
    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where: { userId } }),
      prisma.blogPost.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: POST_SELECT,
      }),
    ]);
    return { total, posts };
  },

  async findAllPosts({ status, category, page = 1, limit = 10 }) {
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    const skip = (Math.max(page, 1) - 1) * limit;
    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: POST_SELECT,
      }),
    ]);
    return { total, posts };
  },

  async updatePost(id, data) {
    return prisma.blogPost.update({ where: { id }, data, select: POST_SELECT });
  },

  async getStats() {
    const [total, pending, approved, rejected, latest] = await Promise.all([
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { status: "PENDING" } }),
      prisma.blogPost.count({ where: { status: "APPROVED" } }),
      prisma.blogPost.count({ where: { status: "REJECTED" } }),
      prisma.blogPost.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
        },
      }),
    ]);
    return { total, pending, approved, rejected, latest };
  },

  async deletePost(id) {
    return prisma.blogPost.delete({ where: { id } });
  },

  async slugExists(slug) {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    });
    return !!post;
  },

  // ── Comments ───────────────────────────────────────────────────────────────

  async createComment({ postId, userId, content }) {
    return prisma.blogComment.create({
      data: { postId, userId, content },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
    });
  },

  async findCommentById(id) {
    return prisma.blogComment.findUnique({ where: { id } });
  },

  async updateComment(id, content) {
    return prisma.blogComment.update({
      where: { id },
      data: { content },
      select: {
        id: true,
        content: true,
        updatedAt: true,
        user: { select: { id: true, name: true } },
      },
    });
  },

  async deleteComment(id) {
    return prisma.blogComment.delete({ where: { id } });
  },
};

module.exports = blogModel;
