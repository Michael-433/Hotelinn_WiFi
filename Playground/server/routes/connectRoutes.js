const express = require("express");

const { connectGuest } = require("../controllers/connectController");
const { connectRateLimiter } = require("../middleware/rateLimiter");
const validateRequest = require("../middleware/validateRequest");
const { connectValidator } = require("../middleware/validators");

const router = express.Router();

router.post(
  "/connect",
  connectRateLimiter,
  connectValidator,
  validateRequest,
  connectGuest,
);

module.exports = router;
