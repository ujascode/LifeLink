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
      index: true, // Index for faster organType searches
    },

    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      index: true, // Index for faster bloodGroup searches
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
      index: true, // Index for availabilityDate (useful for sorting)
    },

    location: {
      address: {
        type: String,
        required: true,
      },

      city: {
        type: String,
        required: true,
        index: true, // Index for city searches
      },

      state: {
        type: String,
        required: true,
        index: true, // Index for state searches
      },

      latitude: {
        type: Number,
      },

      longitude: {
        type: Number,
      },

      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      }
    },

    status: {
      type: String,
      enum: ["Available", "Reserved", "Transplanted", "Expired", "Removed"],
      default: "Available",
      index: true, // Index for status
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

// Index for location-based queries (city, state) - already covered by individual indexes
// 2dsphere index for proximity search is on the coordinates field

module.exports = mongoose.model("Organ", organSchema);
