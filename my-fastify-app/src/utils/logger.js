
const NODE_ENV = process.env.NODE_ENV || "development";

/**
 * Returns a Pino logger config object for the current environment.
 * Used in src/config/server.js — exported here for reuse in tests.
 */
function getLoggerConfig() {
  if (NODE_ENV === "development") {
    return {
      level: "debug",
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
          colorize: true,
        },
      },
    };
  }
  if (NODE_ENV === "test") {
    return { level: "silent" };
  }
  return { level: "info" };
}

module.exports = { getLoggerConfig };
