const crypto = require("crypto");

const { env } = require("../config/env");

const safeCompare = (left, right) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const requireAdminKey = (req, res, next) => {
  if (!env.adminAccessKey) {
    return next();
  }

  const providedKey = (req.get("x-admin-key") || "").trim();

  if (providedKey && safeCompare(providedKey, env.adminAccessKey)) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Admin access key is required to view guest records.",
  });
};

module.exports = requireAdminKey;
