const User = require("../models/User");
const { env } = require("../config/env");
const asyncHandler = require("../middleware/asyncHandler");

const getUsers = asyncHandler(async (req, res) => {
  const requestedPage = Number(req.query.page) || 1;
  const requestedLimit = Number(req.query.limit) || env.defaultUsersPageSize;
  const limit = Math.min(requestedLimit, env.maxUsersPageSize);
  const [totalUsers, latestUser] = await Promise.all([
    User.countDocuments(),
    User.findOne({}, "timestamp").sort({ timestamp: -1, _id: -1 }).lean(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalUsers / limit));
  const page = Math.min(requestedPage, totalPages);
  const skip = (page - 1) * limit;
  const users = await User.find({}, "name email timestamp")
    .sort({ timestamp: -1, _id: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.status(200).json({
    success: true,
    message: "Guest records retrieved successfully.",
    data: {
      users: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        timestamp: user.timestamp,
      })),
    },
    meta: {
      totalUsers,
      totalPages,
      page,
      pageSize: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      latestSignup: latestUser?.timestamp || null,
      fetchedAt: new Date().toISOString(),
    },
  });
});

module.exports = {
  getUsers,
};
