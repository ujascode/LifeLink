const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    pincode: {
      type: String,
      trim: true,
    },

    latitude: {
      type: Number,
    },

    longitude: {
      type: Number,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Verified", "Rejected", "Inactive"],
    },

    role: {
      type: String,
      default: "hospital",
      enum: ["hospital"],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Hospital", hospitalSchema);
