
async function errorHandler(error, request, reply) {
  // ── Prisma errors ──────────────────────────────────────────────────────────
  if (error.code === "P2002") {
    return reply.code(409).send({
      success: false,
      message: "A record with that value already exists",
      field: error.meta?.target ?? null,
    });
  }

  if (error.code === "P2025") {
    return reply.code(404).send({
      success: false,
      message: "Record not found",
    });
  }

  // ── Fastify / AJV validation errors ───────────────────────────────────────
  if (error.validation) {
    return reply.code(400).send({
      success: false,
      message: "Validation error",
      errors: error.validation,
    });
  }

  // ── Application-level errors (thrown with statusCode) ─────────────────────
  const statusCode = error.statusCode || error.status || 500;

  if (statusCode >= 500) {
    request.log.error({ err: error }, "Unhandled server error");
  }

  return reply.code(statusCode).send({
    success: false,
    message: error.message || "Internal Server Error",
  });
}

module.exports = errorHandler;
