const Organ = require("../models/Organ");
const Hospital = require("../models/Hospital");

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
    const organs = await Organ.find({
      status: "Available",
    })
      .populate("hospital", "hospitalName email phone city state")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: organs.length,
      organs,
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
    const organ = await Organ.findById(req.params.id).populate(
      "hospital",
      "hospitalName email phone city state",
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

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        organ[field] = req.body[field];
      }
    });

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

    await Organ.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Organ deleted successfully",
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
