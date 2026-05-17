const PORT = parseInt(process.env.PORT || "5000", 10);
const HOST = process.env.HOST || "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";
const loggerConfig = { level: NODE_ENV === "production" ? "warn" : "info" };

module.exports = { PORT, HOST, NODE_ENV, loggerConfig };
