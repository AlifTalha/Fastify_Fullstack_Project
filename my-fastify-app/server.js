
const buildApp = require("./src/app");
const { PORT, HOST } = require("./src/config/server");

const app = buildApp();

const start = async () => {
  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
