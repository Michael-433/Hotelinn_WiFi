require("dotenv").config();

const path = require("path");
const mongoose = require("mongoose");
const compression = require("compression");
const express = require("express");
const hpp = require("hpp");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");

const connectDatabase = require("./server/config/db");
const { env, validateEnvironment } = require("./server/config/env");
const connectRoutes = require("./server/routes/connectRoutes");
const userRoutes = require("./server/routes/userRoutes");
const { notFound, errorHandler } = require("./server/middleware/errorHandler");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.trustProxy);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
  }),
);
app.use(compression());
app.use(hpp());
app.use(morgan(env.isProduction ? "combined" : "dev"));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(mongoSanitize());
app.use((req, res, next) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  if (
    req.path === "/admin" ||
    req.path.startsWith("/api/") ||
    req.path.endsWith(".html")
  ) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  next();
});

app.use("/api", connectRoutes);
app.use("/api", userRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Hotelinn Lagos Wi-Fi API is healthy.",
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.nodeEnv,
    },
  });
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  validateEnvironment();
  await connectDatabase();

  const server = app.listen(env.port, () => {
    console.log(`Hotelinn Lagos portal is live on port ${env.port}.`);
  });

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(`Received ${signal}. Starting graceful shutdown.`);

    await new Promise((resolve) => {
      server.close(() => resolve());
    });

    await mongoose.connection.close(false);
    process.exit(0);
  };

  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, () => {
      shutdown(signal).catch((error) => {
        console.error("Graceful shutdown failed:", error.message);
        process.exit(1);
      });
    });
  });

  return server;
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Unable to start server:", error.message);
    process.exit(1);
  });
}

module.exports = { app, startServer };
