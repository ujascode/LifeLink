const Organ = require("../models/Organ");
const Hospital = require("../models/Hospital");
const mongoose = require("mongoose");

// ==========================================
// ADD ORGAN
// ==========================================

const createOrgan = async (req, res) => {
  try {
    const hospitalId = req.user.id;

    // Verify hospital exists
    const hospital = await Hospital.findById(hospitalId);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    // Only verified hospitals can add organs
    if (!hospital.isVerified || hospital.status !== "Verified") {
      return res.status(403).json({
        success: false,
        message: "Only verified hospitals can add organs",
      });
    }

    const {
      organType,
      bloodGroup,
      donorAge,
      donorGender,
      availabilityDate,
      location,
      notes,
    } = req.body;

    // Required fields
    if (
      !organType ||
      !bloodGroup ||
      donorAge === undefined ||
      !donorGender ||
      !availabilityDate ||
      !location ||
      !location.address ||
      !location.city ||
      !location.state
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required organ details",
      });
    }

    // Set coordinates for geospatial queries
    if (location && location.latitude !== undefined && location.longitude !== undefined) {
      location.coordinates = [location.longitude, location.latitude];
    }

    const organ = await Organ.create({
      hospital: hospitalId,
      organType,
      bloodGroup,
      donorAge,
      donorGender,
      availabilityDate,
      location,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Organ added successfully",
      organ,
    });
  } catch (error) {
    console.error("Create organ error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while adding organ",
    });
  }
};

// ==========================================
// GET ALL AVAILABLE ORGANS
// ==========================================

const getOrgans = async (req, res) => {
  try {
    const filter = {};
    const requestedStatus = req.query.status;
    const { organType, bloodGroup, city, state, latitude, longitude, radius } = req.query;

    // Add organType and bloodGroup if provided
    if (organType) filter.organType = organType;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    // For location, we can do city and state exact matches (case insensitive)
    if (city) {
      filter["location.city"] = new RegExp(city, "i");
    }
    if (state) {
      filter["location.state"] = new RegExp(state, "i");
    }

    // Proximity search using latitude and longitude
    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const rad = radius ? parseFloat(radius) : 50; // default radius 50 km

      // Validate latitude and longitude
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return res.status(400).json({
          success: false,
          message: "Invalid latitude. Must be a number between -90 and 90.",
        });
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: "Invalid longitude. Must be a number between -180 and 180.",
        });
      }
      if (isNaN(rad) || rad <= 0 || rad > 200) {
        return res.status(400).json({
          success: false,
          message: "Invalid radius. Must be a positive number between 0 and 200 km.",
        });
      }

      // Convert radius from kilometers to meters for $maxDistance
      const radiusInMeters = rad * 1000;

      filter.location.coordinates = {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat]
          },
          $maxDistance: radiusInMeters
        }
      };
    }

    // Existing logic for status and mine
    if (req.user.role === "admin") {
      if (requestedStatus) filter.status = requestedStatus;
    } else if (req.query.mine === "true") {
      filter.hospital = req.user.id;
      filter.status = requestedStatus || { $ne: "Removed" };
    } else {
      // Exchange search only exposes available organs from verified hospitals.
      filter.status = "Available";
      filter.hospital = { $ne: req.user.id };
    }

    const organs = await Organ.find(filter)
      .populate("hospital", "hospitalName city state status isVerified latitude longitude")
      .sort({ createdAt: -1 })
      .lean();

    const visibleOrgans = req.user.role === "admin"
      ? organs
      : organs.filter((organ) => organ.hospital?.status === "Verified" || !organ.hospital?.status);

    return res.status(200).json({
      success: true,
      count: visibleOrgans.length,
      organs: visibleOrgans,
    });
  } catch (error) {
    console.error("Get organs error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching organs",
    });
  }
};

// ==========================================
// GET ORGAN BY ID
// ==========================================

const getOrganById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid organ id" });
    }

    const organ = await Organ.findById(req.params.id).populate(
      "hospital",
      "hospitalName city state status isVerified latitude longitude",
    );

    if (!organ) {
      return res.status(404).json({
        success: false,
        message: "Organ not found",
      });
    }

    return res.status(200).json({
      success: true,
      organ,
    });
  } catch (error) {
    console.error("Get organ error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching organ",
    });
  }
};

// ==========================================
// UPDATE ORGAN
// ==========================================

const updateOrgan = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid organ id" });
    }
    const organ = await Organ.findById(req.params.id);

    if (!organ) {
      return res.status(404).json({
        success: false,
        message: "Organ not found",
      });
    }

    // Only owning hospital can update
    if (organ.hospital.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own organ records",
      });
    }

    const hospital = await Hospital.findById(req.user.id).select("isVerified status");
    if (!hospital || !hospital.isVerified || hospital.status !== "Verified") {
      return res.status(403).json({ success: false, message: "Only verified hospitals can update organs" });
    }

    const allowedFields = [
      "organType",
      "bloodGroup",
      "donorAge",
      "donorGender",
      "availabilityDate",
      "location",
      "status",
      "notes",
    ];

    if (req.body.status !== undefined && !["Available", "Expired", "Removed"].includes(req.body.status)) {
      return res.status(400).json({ success: false, message: "This organ status can only be changed through the request workflow" });
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        organ[field] = req.body[field];
      }
    });

    // Update coordinates for geospatial queries if location was modified
    if (req.body.location !== undefined) {
      const loc = req.body.location;
      if (loc.latitude !== undefined && loc.longitude !== undefined) {
        organ.location.coordinates = [loc.longitude, loc.latitude];
      }
    }

    await organ.save();

    return res.status(200).json({
      success: true,
      message: "Organ updated successfully",
      organ,
    });
  } catch (error) {
    console.error("Update organ error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating organ",
    });
  }
};

// ==========================================
// DELETE ORGAN
// ==========================================

const deleteOrgan = async (req, res) => {
  try {
    const organ = await Organ.findById(req.params.id);

    if (!organ) {
      return res.status(404).json({
        success: false,
        message: "Organ not found",
      });
    }

    // Only owning hospital can delete
    if (organ.hospital.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own organ records",
      });
    }

    const hospital = await Hospital.findById(req.user.id).select("isVerified status");
    if (!hospital || !hospital.isVerified || hospital.status !== "Verified") {
      return res.status(403).json({ success: false, message: "Only verified hospitals can remove organs" });
    }

    organ.status = "Removed";
    await organ.save();

    return res.status(200).json({
      success: true,
      message: "Organ removed successfully",
    });
  } catch (error) {
    console.error("Delete organ error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting organ",
    });
  }
};

module.exports = {
  createOrgan,
  getOrgans,
  getOrganById,
  updateOrgan,
  deleteOrgan,
};
