const express = require("express");

const { getUsers } = require("../controllers/userController");
const requireAdminKey = require("../middleware/adminAuth");
const { usersRateLimiter } = require("../middleware/rateLimiter");
const validateRequest = require("../middleware/validateRequest");
const { usersQueryValidator } = require("../middleware/validators");

const router = express.Router();

router.get(
  "/users",
  usersRateLimiter,
  requireAdminKey,
  usersQueryValidator,
  validateRequest,
  getUsers,
);

module.exports = router;
