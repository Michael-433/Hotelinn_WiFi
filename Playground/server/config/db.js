const mongoose = require("mongoose");
const { env } = require("./env");

mongoose.set("strictQuery", true);

let listenersBound = false;

const bindConnectionListeners = () => {
  if (listenersBound) {
    return;
  }

  listenersBound = true;

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connection established.");
  });

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB connection closed.");
  });
};

const connectDatabase = async () => {
  bindConnectionListeners();

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(env.mongoUri, {
    autoIndex: !env.isProduction,
    maxPoolSize: env.isProduction ? 20 : 10,
    serverSelectionTimeoutMS: 10000,
  });

  return mongoose.connection;
};

module.exports = connectDatabase;
