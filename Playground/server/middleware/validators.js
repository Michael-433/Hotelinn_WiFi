const { body, query } = require("express-validator");
const { env } = require("../config/env");

const sanitizePlainText = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const sanitizeEmail = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
};

const connectValidator = [
  body("website")
    .custom((value) => value === undefined || value === "")
    .withMessage("Invalid submission."),
  body("name")
    .isString()
    .withMessage("Full name is required.")
    .bail()
    .customSanitizer(sanitizePlainText)
    .notEmpty()
    .withMessage("Full name is required.")
    .bail()
    .isLength({ min: 2, max: 80 })
    .withMessage("Full name must be between 2 and 80 characters."),
  body("email")
    .isString()
    .withMessage("Email address is required.")
    .bail()
    .customSanitizer(sanitizeEmail)
    .notEmpty()
    .withMessage("Email address is required.")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .bail()
    .normalizeEmail()
    .isLength({ max: 120 })
    .withMessage("Email address must be 120 characters or fewer."),
  body("device")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Device information must be text.")
    .bail()
    .customSanitizer(sanitizePlainText)
    .isLength({ max: 200 })
    .withMessage("Device information must be 200 characters or fewer."),
];

const usersQueryValidator = [
  query("page")
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage("Page must be a positive integer.")
    .bail()
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: env.maxUsersPageSize })
    .withMessage(`Limit must be between 1 and ${env.maxUsersPageSize}.`)
    .bail()
    .toInt(),
];

module.exports = {
  connectValidator,
  usersQueryValidator,
};
