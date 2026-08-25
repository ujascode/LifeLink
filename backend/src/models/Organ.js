const mongoose = require("mongoose");

const organSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    organType: {
      type: String,
      required: true,
      enum: [
        "Heart",
        "Liver",
        "Kidney",
        "Lung",
        "Pancreas",
        "Intestine",
        "Cornea",
      ],
      trim: true,
    },

    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },

    donorAge: {
      type: Number,
      required: true,
      min: 0,
      max: 120,
    },

    donorGender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },

    availabilityDate: {
      type: Date,
      required: true,
    },

    location: {
      address: {
        type: String,
        required: true,
      },

      city: {
        type: String,
        required: true,
      },

      state: {
        type: String,
        required: true,
      },

      latitude: {
        type: Number,
      },

      longitude: {
        type: Number,
      },
    },

    status: {
      type: String,
      enum: ["Available", "Reserved", "Transplanted", "Expired", "Removed"],
      default: "Available",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Organ", organSchema);
