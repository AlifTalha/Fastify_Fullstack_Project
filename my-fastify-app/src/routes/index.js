const userRoutes = require("./userRoutes");
const chatRoutes = require("./chatRoutes");
const ticketRoutes = require("./ticketRoutes");
const blogRoutes = require("./blogRoutes");
const shopRoutes = require("./shopRoutes");

async function registerRoutes(fastify) {
  fastify.register(userRoutes, { prefix: "/v1" });
  fastify.register(chatRoutes, { prefix: "/v1/chat" });
  fastify.register(ticketRoutes, { prefix: "/v1/tickets" });
  fastify.register(blogRoutes, { prefix: "/v1/blog" });
  fastify.register(shopRoutes, { prefix: "/v1/shop" });
}

module.exports = registerRoutes;
