const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (error, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = error.message || "Internal server error.";

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed for the submitted request.";
  }

  if (error.name === "CastError") {
    statusCode = 400;
    message = "One or more request values are invalid.";
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = "A conflicting record already exists.";
  }

  if (error.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large.";
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    statusCode = 400;
    message = "Invalid JSON payload.";
  }

  const payload = {
    success: false,
    message: statusCode >= 500 && process.env.NODE_ENV === "production"
      ? "An unexpected server error occurred."
      : message,
  };

  if (process.env.NODE_ENV !== "production") {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
};

module.exports = {
  notFound,
  errorHandler,
};
