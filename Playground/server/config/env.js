const parseNumber = (value, fallback, bounds = {}) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  if (typeof bounds.min === "number" && parsed < bounds.min) {
    return fallback;
  }

  if (typeof bounds.max === "number" && parsed > bounds.max) {
    return fallback;
  }

  return parsed;
};

const parseTrustProxy = (value) => {
  if (value === undefined || value === null || value === "") {
    return 1;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : value;
};

const nodeEnv = process.env.NODE_ENV || "development";
const adminAccessKey =
  typeof process.env.ADMIN_ACCESS_KEY === "string"
    ? process.env.ADMIN_ACCESS_KEY.trim()
    : "";

const env = Object.freeze({
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: parseNumber(process.env.PORT, 3000, { min: 1, max: 65535 }),
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  mongoUri: process.env.MONGODB_URI || "",
  hotelName: process.env.HOTEL_NAME || "Hotelinn Lagos",
  wifiSsid: process.env.WIFI_SSID || "",
  wifiPassword: process.env.WIFI_PASSWORD || "",
  receptionExtension: process.env.RECEPTION_EXTENSION || "Front Desk",
  rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 900000, {
    min: 1000,
    max: 86400000,
  }),
  connectRateLimitMax: parseNumber(process.env.CONNECT_RATE_LIMIT_MAX, 20, {
    min: 1,
    max: 1000,
  }),
  usersRateLimitMax: parseNumber(process.env.USERS_RATE_LIMIT_MAX, 60, {
    min: 1,
    max: 10000,
  }),
  defaultUsersPageSize: parseNumber(process.env.DEFAULT_USERS_PAGE_SIZE, 25, {
    min: 1,
    max: 100,
  }),
  maxUsersPageSize: parseNumber(process.env.MAX_USERS_PAGE_SIZE, 100, {
    min: 1,
    max: 500,
  }),
  adminAccessKey,
});

const validateEnvironment = () => {
  const requiredVariables = [];

  if (!env.mongoUri) {
    requiredVariables.push("MONGODB_URI");
  }

  if (!env.wifiSsid) {
    requiredVariables.push("WIFI_SSID");
  }

  if (!env.wifiPassword) {
    requiredVariables.push("WIFI_PASSWORD");
  }

  if (requiredVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${requiredVariables.join(", ")}`,
    );
  }

  if (env.defaultUsersPageSize > env.maxUsersPageSize) {
    throw new Error(
      "DEFAULT_USERS_PAGE_SIZE cannot be greater than MAX_USERS_PAGE_SIZE.",
    );
  }

  if (env.isProduction && !env.adminAccessKey) {
    throw new Error(
      "ADMIN_ACCESS_KEY must be configured before starting in production.",
    );
  }
};

module.exports = {
  env,
  validateEnvironment,
};
