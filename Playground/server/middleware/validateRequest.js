const { validationResult } = require("express-validator");

const validateRequest = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const seenFields = new Set();
  const errors = result.array().reduce((accumulator, issue) => {
    if (seenFields.has(issue.path)) {
      return accumulator;
    }

    seenFields.add(issue.path);
    accumulator.push({
      field: issue.path,
      message: issue.msg,
    });

    return accumulator;
  }, []);

  return res.status(422).json({
    success: false,
    message: "Please correct the highlighted details and try again.",
    errors,
  });
};

module.exports = validateRequest;
