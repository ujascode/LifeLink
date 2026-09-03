const mongoose = require("mongoose");

const organRequestSchema = new mongoose.Schema(
  {
    organ: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organ",
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

    patientName: {
      type: String,
      required: true,
      trim: true,
    },

    patientAge: {
      type: Number,
      required: true,
      min: 0,
      max: 120,
    },

    patientGender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },

    urgency: {
      type: String,
      required: true,
      enum: ["Low", "Medium", "High", "Critical"],
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Cancelled", "Completed"],
      default: "Pending",
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
