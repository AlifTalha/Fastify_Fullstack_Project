const fp = require("fastify-plugin");
const jwt = require("@fastify/jwt");

/**
 * Registers @fastify/jwt and exposes two reusable preHandlers:
 *   fastify.authenticate  — verifies the Bearer token
 *   fastify.authorizeAdmin — verifies the token AND requires role === 'ADMIN'
 */
async function authPlugin(fastify) {
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET || "changeme_use_a_strong_secret",
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN || "60d",
    },
  });

  fastify.decorate("authenticate", async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({
        success: false,
        message: "Unauthorized: invalid or expired access token",
      });
    }
  });

  fastify.decorate("authorizeAdmin", async function (request, reply) {
    try {
      await request.jwtVerify();
      if (request.user.role !== "ADMIN") {
        return reply.code(403).send({
          success: false,
          message: "Forbidden: admin access required",
        });
      }
    } catch (err) {
      reply.code(401).send({
        success: false,
        message: "Unauthorized: invalid or expired access token",
      });
    }
  });
}

module.exports = fp(authPlugin);
