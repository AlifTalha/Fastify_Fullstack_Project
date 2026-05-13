
const PORT = 5000;
const HOST = "localhost";
const NODE_ENV = process.env.NODE_ENV || "development";
const loggerConfig = { level: "info" };

module.exports = { PORT, HOST, NODE_ENV, loggerConfig };
