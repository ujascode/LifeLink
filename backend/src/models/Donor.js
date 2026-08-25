const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema(
  {
    donorName: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      required: true,
      min: 0,
    },

    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },

    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },

    organName: {
      type: String,
      required: true,
      trim: true,
    },

    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    status: {
      type: String,
      default: "Available",
      enum: ["Available", "Unavailable"],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Donor", donorSchema);
