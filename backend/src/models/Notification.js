const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
    },

    recipientAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    type: {
      type: String,
      required: true,
      enum: [
        "NewRequest",
        "RequestApproved",
        "RequestRejected",
        "RequestUpdated",
        "HospitalVerified",
        "General",
      ],
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrganRequest",
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Notification", notificationSchema);
