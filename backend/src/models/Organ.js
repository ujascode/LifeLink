const mongoose = require("mongoose");

const organSchema = new mongoose.Schema(
  {
    organName: {
      type: String,
      required: true,
      trim: true,
    },

    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donor",
      required: true,
    },

    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },

    availability: {
      type: String,
      default: "Available",
      enum: ["Available", "Reserved", "Transferred", "Unavailable"],
    },

    status: {
      type: String,
      default: "Active",
      enum: ["Active", "Inactive"],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Organ", organSchema);
