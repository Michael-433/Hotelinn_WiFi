const User = require("../models/User");
const { env } = require("../config/env");
const asyncHandler = require("../middleware/asyncHandler");

const normalizeDevice = (providedDevice, userAgent) => {
  const rawValue =
    typeof providedDevice === "string" && providedDevice.trim()
      ? providedDevice
      : userAgent || "";

  return rawValue.replace(/\s+/g, " ").trim().slice(0, 200);
};

const normalizeName = (value) => value.replace(/\s+/g, " ").trim();
const normalizeEmail = (value) => value.trim().toLowerCase();

const buildInstructions = (ssid) => [
  "Open your device's Wi-Fi settings.",
  `Select "${ssid}".`,
  "Enter the password shown below to finish connecting.",
];

const connectGuest = asyncHandler(async (req, res) => {
  const { name, email, device } = req.body;
  const normalizedDevice = normalizeDevice(device, req.get("user-agent"));
  const normalizedName = normalizeName(name);
  const normalizedEmail = normalizeEmail(email);

  const guest = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    device: normalizedDevice,
  });

  res.status(201).json({
    success: true,
    message: `Welcome to ${env.hotelName} Wi-Fi.`,
    data: {
      guest: guest.toJSON(),
      wifi: {
        ssid: env.wifiSsid,
        password: env.wifiPassword,
      },
      instructions: buildInstructions(env.wifiSsid),
      support: {
        hotelName: env.hotelName,
        receptionExtension: env.receptionExtension,
      },
    },
  });
});

module.exports = {
  connectGuest,
};
