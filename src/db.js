const Redis = require("ioredis");
const redis = new Redis(process.env.SERVER_REDIS_PORT, process.env.SERVER_REDIS_HOST);

module.exports = redis;
