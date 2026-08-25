const mongoose = require("mongoose");

const organRequestSchema = new mongoose.Schema(
  {
    organ: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organ",
      required: true,
    },

    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donor",
      required: true,
    },

    requestingHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    supplyingHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    requestStatus: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Approved", "Rejected", "Cancelled", "Completed"],
    },

    requestDate: {
      type: Date,
      default: Date.now,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    responseMessage: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("OrganRequest", organRequestSchema);
