"use strict";

const blogController = require("../controllers/blogController");

/**
 * Blog routes — mounted at /api/v1/blog
 *
 * Public (no auth):
 *   GET  /posts                     — list approved posts (?category=&page=&limit=)
 *   GET  /posts/:slug               — get post detail (login required enforced in route)
 *
 * User (authenticate):
 *   POST   /posts                   — create post (multipart: title, content, category, videoLink, image, pdf)
 *   GET    /posts/my                — list my posts
 *   PUT    /posts/:id               — edit my post (multipart, resets to PENDING)
 *   DELETE /posts/:id               — delete my post
 *   POST   /posts/:id/comments      — add comment to approved post
 *   PUT    /posts/:id/comments/:commentId   — edit own comment
 *   DELETE /posts/:id/comments/:commentId   — delete own comment
 *
 * Admin (authorizeAdmin):
 *   GET    /admin/posts             — list all posts (?status=&category=&page=&limit=)
 *   PATCH  /admin/posts/:id/approve — approve post
 *   PATCH  /admin/posts/:id/reject  — reject post
 *   DELETE /admin/posts/:id         — delete any post
 *   DELETE /admin/posts/:id/comments/:commentId — delete any comment
 */
async function blogRoutes(fastify) {
  // ── Public ─────────────────────────────────────────────────────────────────
  fastify.get("/posts", blogController.getPublicPosts);

  // Post detail requires login
  fastify.get(
    "/posts/:slug",
    { preHandler: [fastify.authenticate] },
    blogController.getPublicPostBySlug,
  );

  // ── User ───────────────────────────────────────────────────────────────────
  fastify.post(
    "/posts",
    { preHandler: [fastify.authenticate] },
    blogController.createPost,
  );

  fastify.get(
    "/posts/my",
    { preHandler: [fastify.authenticate] },
    blogController.getMyPosts,
  );

  fastify.put(
    "/posts/:id",
    { preHandler: [fastify.authenticate] },
    blogController.updatePost,
  );

  fastify.delete(
    "/posts/:id",
    { preHandler: [fastify.authenticate] },
    blogController.deletePost,
  );

  fastify.post(
    "/posts/:id/comments",
    { preHandler: [fastify.authenticate] },
    blogController.addComment,
  );

  fastify.put(
    "/posts/:id/comments/:commentId",
    { preHandler: [fastify.authenticate] },
    blogController.editComment,
  );

  fastify.delete(
    "/posts/:id/comments/:commentId",
    { preHandler: [fastify.authenticate] },
    blogController.deleteComment,
  );

  // ── Admin ──────────────────────────────────────────────────────────────────
  fastify.get(
    "/admin/stats",
    { preHandler: [fastify.authorizeAdmin] },
    blogController.getBlogStats,
  );

  fastify.get(
    "/admin/posts",
    { preHandler: [fastify.authorizeAdmin] },
    blogController.getAllPosts,
  );

  fastify.patch(
    "/admin/posts/:id/status",
    { preHandler: [fastify.authorizeAdmin] },
    blogController.updatePostStatus,
  );

  fastify.delete(
    "/admin/posts/:id",
    { preHandler: [fastify.authorizeAdmin] },
    blogController.deletePost,
  );

  fastify.delete(
    "/admin/posts/:id/comments/:commentId",
    { preHandler: [fastify.authorizeAdmin] },
    blogController.deleteComment,
  );
}

module.exports = blogRoutes;
