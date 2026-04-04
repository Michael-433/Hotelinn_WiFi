const mongoose = require("mongoose");

const sanitizeValue = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
      set: sanitizeValue,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address."],
      set: (value) => sanitizeValue(value)?.toLowerCase(),
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    device: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
      set: sanitizeValue,
    },
  },
  {
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
    versionKey: false,
  },
);

userSchema.index({ timestamp: -1, _id: -1 });

module.exports = mongoose.model("User", userSchema);
