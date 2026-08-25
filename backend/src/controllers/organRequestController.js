const OrganRequest = require("../models/OrganRequest");
const Organ = require("../models/Organ");
const Hospital = require("../models/Hospital");

// ==========================================
// CREATE ORGAN REQUEST
// ==========================================

const createOrganRequest = async (req, res) => {
  try {
    const requestingHospitalId = req.user.id;

    const { organId, patientName, patientAge, patientGender, urgency, reason } =
      req.body;

    // ------------------------------------------
    // Validate required fields
    // ------------------------------------------

    if (
      !organId ||
      !patientName ||
      patientAge === undefined ||
      !patientGender ||
      !urgency ||
      !reason
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required request details",
      });
    }

    // ------------------------------------------
    // Check requesting hospital
    // ------------------------------------------

    const requestingHospital = await Hospital.findById(requestingHospitalId);

    if (!requestingHospital) {
      return res.status(404).json({
        success: false,
        message: "Requesting hospital not found",
      });
    }

    if (
      !requestingHospital.isVerified ||
      requestingHospital.status !== "Verified"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only verified hospitals can send organ requests",
      });
    }

    // ------------------------------------------
    // Find organ
    // ------------------------------------------

    const organ = await Organ.findById(organId);

    if (!organ) {
      return res.status(404).json({
        success: false,
        message: "Organ not found",
      });
    }

    // ------------------------------------------
    // Organ must be available
    // ------------------------------------------

    if (organ.status !== "Available") {
      return res.status(400).json({
        success: false,
        message: "This organ is no longer available",
      });
    }

    // ------------------------------------------
    // Prevent requesting own hospital organ
    // ------------------------------------------

    if (organ.hospital.toString() === requestingHospitalId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Hospital cannot request an organ from itself",
      });
    }

    // ------------------------------------------
    // Check supplying hospital
    // ------------------------------------------

    const supplyingHospital = await Hospital.findById(organ.hospital);

    if (!supplyingHospital) {
      return res.status(404).json({
        success: false,
        message: "Supplying hospital not found",
      });
    }

    // ------------------------------------------
    // Prevent duplicate pending request
    // ------------------------------------------

    const existingRequest = await OrganRequest.findOne({
      organ: organId,
      requestingHospital: requestingHospitalId,
      status: "Pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending request for this organ",
      });
    }

    // ------------------------------------------
    // Create request
    // ------------------------------------------

    const organRequest = await OrganRequest.create({
      organ: organId,
      requestingHospital: requestingHospitalId,
      supplyingHospital: organ.hospital,

      patientName,
      patientAge,
      patientGender,
      urgency,
      reason,

      status: "Pending",
    });

    // ------------------------------------------
    // Return populated request
    // ------------------------------------------

    const populatedRequest = await OrganRequest.findById(organRequest._id)
      .populate(
        "organ",
        "organType bloodGroup donorAge donorGender status location",
      )
      .populate("requestingHospital", "hospitalName email phone city state")
      .populate("supplyingHospital", "hospitalName email phone city state");

    return res.status(201).json({
      success: true,
      message: "Organ request sent successfully",
      request: populatedRequest,
    });
  } catch (error) {
    console.error("Create organ request error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating organ request",
    });
  }
};

// ==========================================
// GET SENT REQUESTS
// ==========================================

const getSentRequests = async (req, res) => {
  try {
    const requests = await OrganRequest.find({
      requestingHospital: req.user.id,
    })
      .populate("organ", "organType bloodGroup status location")
      .populate("supplyingHospital", "hospitalName email phone city state")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Get sent requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching sent requests",
    });
  }
};

// ==========================================
// GET RECEIVED REQUESTS
// ==========================================

const getReceivedRequests = async (req, res) => {
  try {
    const requests = await OrganRequest.find({
      supplyingHospital: req.user.id,
    })
      .populate("organ", "organType bloodGroup status location")
      .populate("requestingHospital", "hospitalName email phone city state")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Get received requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching received requests",
    });
  }
};

// ==========================================
// GET REQUEST BY ID
// ==========================================

const getOrganRequestById = async (req, res) => {
  try {
    const request = await OrganRequest.findById(req.params.id)
      .populate(
        "organ",
        "organType bloodGroup donorAge donorGender status location",
      )
      .populate("requestingHospital", "hospitalName email phone city state")
      .populate("supplyingHospital", "hospitalName email phone city state");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Organ request not found",
      });
    }

    // Only participating hospitals can view request
    const userId = req.user.id.toString();

    if (
      request.requestingHospital._id.toString() !== userId &&
      request.supplyingHospital._id.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this request",
      });
    }

    return res.status(200).json({
      success: true,
      request,
    });
  } catch (error) {
    console.error("Get organ request error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching organ request",
    });
  }
};

// ==========================================
// RESPOND TO REQUEST
// ACCEPT / REJECT
// ==========================================

const respondToOrganRequest = async (req, res) => {
  try {
    const { status, responseMessage } = req.body;

    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Accepted or Rejected",
      });
    }

    const request = await OrganRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Organ request not found",
      });
    }

    // Only supplying hospital can respond
    if (request.supplyingHospital.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the supplying hospital can respond to this request",
      });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "This request has already been processed",
      });
    }

    const organ = await Organ.findById(request.organ);

    if (!organ) {
      return res.status(404).json({
        success: false,
        message: "Organ not found",
      });
    }

    // ------------------------------------------
    // ACCEPT REQUEST
    // ------------------------------------------

    if (status === "Accepted") {
      if (organ.status !== "Available") {
        return res.status(400).json({
          success: false,
          message: "This organ is no longer available",
        });
      }

      request.status = "Accepted";
      organ.status = "Reserved";
    }

    // ------------------------------------------
    // REJECT REQUEST
    // ------------------------------------------

    if (status === "Rejected") {
      request.status = "Rejected";

      // Organ remains available
      if (organ.status === "Reserved") {
        organ.status = "Available";
      }
    }

    request.responseMessage = responseMessage;
    request.respondedAt = new Date();

    await request.save();
    await organ.save();

    const populatedRequest = await OrganRequest.findById(request._id)
      .populate(
        "organ",
        "organType bloodGroup donorAge donorGender status location",
      )
      .populate("requestingHospital", "hospitalName email phone city state")
      .populate("supplyingHospital", "hospitalName email phone city state");

    return res.status(200).json({
      success: true,
      message: `Organ request ${status.toLowerCase()} successfully`,
      request: populatedRequest,
    });
  } catch (error) {
    console.error("Respond to organ request error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while responding to organ request",
    });
  }
};

// ==========================================
// CANCEL REQUEST
// ==========================================

const cancelOrganRequest = async (req, res) => {
  try {
    const request = await OrganRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Organ request not found",
      });
    }

    // Only requesting hospital can cancel
    if (request.requestingHospital.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the requesting hospital can cancel this request",
      });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be cancelled",
      });
    }

    request.status = "Cancelled";
    request.respondedAt = new Date();

    await request.save();

    return res.status(200).json({
      success: true,
      message: "Organ request cancelled successfully",
      request,
    });
  } catch (error) {
    console.error("Cancel organ request error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while cancelling organ request",
    });
  }
};

// ==========================================
// COMPLETE REQUEST
// ==========================================

const completeOrganRequest = async (req, res) => {
  try {
    const request = await OrganRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Organ request not found",
      });
    }

    // Both participating hospitals can complete
    const userId = req.user.id.toString();

    if (
      request.requestingHospital.toString() !== userId &&
      request.supplyingHospital.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to complete this request",
      });
    }

    if (request.status !== "Accepted") {
      return res.status(400).json({
        success: false,
        message: "Only accepted requests can be completed",
      });
    }

    const organ = await Organ.findById(request.organ);

    if (!organ) {
      return res.status(404).json({
        success: false,
        message: "Organ not found",
      });
    }

    request.status = "Completed";
    request.respondedAt = new Date();

    organ.status = "Transplanted";

    await request.save();
    await organ.save();

    return res.status(200).json({
      success: true,
      message: "Organ request completed successfully",
      request,
      organ,
    });
  } catch (error) {
    console.error("Complete organ request error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while completing organ request",
    });
  }
};

module.exports = {
  createOrganRequest,
  getSentRequests,
  getReceivedRequests,
  getOrganRequestById,
  respondToOrganRequest,
  cancelOrganRequest,
  completeOrganRequest,
};
