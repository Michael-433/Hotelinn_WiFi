const rateLimit = require("express-rate-limit");
const { env } = require("../config/env");

const buildLimiter = (maxRequests, message) =>
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
        meta: {
          retryAfterSeconds: Math.ceil(env.rateLimitWindowMs / 1000),
        },
      });
    },
  });

const connectRateLimiter = buildLimiter(
  env.connectRateLimitMax,
  "Too many connection attempts from this network. Please wait and try again.",
);

const usersRateLimiter = buildLimiter(
  env.usersRateLimitMax,
  "Too many admin requests from this network. Please slow down and try again.",
);

module.exports = {
  connectRateLimiter,
  usersRateLimiter,
};
