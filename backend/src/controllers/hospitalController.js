const Hospital = require("../models/Hospital");
const Organ = require("../models/Organ");
const OrganRequest = require("../models/OrganRequest");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
// ==========================================
// GET ALL HOSPITALS
// ==========================================

const getHospitals = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { status: "Verified", isVerified: true };
    const hospitals = await Hospital.find(filter)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: hospitals.length,
      hospitals,
    });
  } catch (error) {
    console.error("Get hospitals error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching hospitals",
    });
  }
};

// ==========================================
// GET HOSPITAL BY ID
// ==========================================

const getHospitalById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid hospital id" });
    }

    if (req.user.role === "hospital" && req.user.id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: "You can only view your own hospital profile" });
    }

    const hospital = await Hospital.findById(req.params.id).select(
      "-password -resetPasswordToken -resetPasswordExpires",
    );

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    return res.status(200).json({
      success: true,
      hospital,
    });
  } catch (error) {
    console.error("Get hospital error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching hospital",
    });
  }
};

// ==========================================
// GET LOGGED-IN HOSPITAL PROFILE
// ==========================================

const getMyProfile = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.user.id).select(
      "-password -resetPasswordToken -resetPasswordExpires",
    );

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      hospital,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

// ==========================================
// UPDATE LOGGED-IN HOSPITAL PROFILE
// ==========================================

const updateMyProfile = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.user.id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital profile not found",
      });
    }

    const {
      hospitalName,
      phone,
      address,
      city,
      state,
      pincode,
      latitude,
      longitude,
    } = req.body;

    if (hospitalName !== undefined && (!String(hospitalName).trim() || String(hospitalName).length > 160)) {
      return res.status(400).json({ success: false, message: "Hospital name must be between 1 and 160 characters" });
    }

    if (hospitalName !== undefined) {
      hospital.hospitalName = hospitalName;
    }

    if (phone !== undefined) {
      hospital.phone = phone;
    }

    if (address !== undefined) {
      hospital.address = address;
    }

    if (city !== undefined) {
      hospital.city = city;
    }

    if (state !== undefined) {
      hospital.state = state;
    }

    if (pincode !== undefined) {
      hospital.pincode = pincode;
    }

    if (latitude !== undefined) {
      hospital.latitude = latitude;
    }

    if (longitude !== undefined) {
      hospital.longitude = longitude;
    }

    await hospital.save();

    const updatedHospital = await Hospital.findById(hospital._id).select(
      "-password -resetPasswordToken -resetPasswordExpires",
    );

    return res.status(200).json({
      success: true,
      message: "Hospital profile updated successfully",
      hospital: updatedHospital,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
};

// ==========================================
// VERIFY HOSPITAL
// ADMIN ONLY
// ==========================================

const verifyHospital = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid hospital id" });
    }
    const { status } = req.body || {};

    const allowedStatuses = ["Verified", "Rejected", "Inactive"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Verified, Rejected, or Inactive",
      });
    }

    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    hospital.status = status;
    hospital.isVerified = status === "Verified";

    await hospital.save();

    if (status === "Verified") {
      await Notification.create({
        recipientHospital: hospital._id,
        recipientAdmin: req.user.id,
        type: "HospitalVerified",
        title: "Hospital verification complete",
        message: "Your hospital is now verified and can participate in organ exchange.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Hospital ${status.toLowerCase()} successfully`,
      hospital: {
        id: hospital._id,
        hospitalName: hospital.hospitalName,
        email: hospital.email,
        status: hospital.status,
        isVerified: hospital.isVerified,
      },
    });
  } catch (error) {
    console.error("Verify hospital error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while verifying hospital",
    });
  }
};

// ==========================================
// HOSPITAL DASHBOARD
// ==========================================

const getHospitalDashboard = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const hospital = await Hospital.findById(hospitalId).select(
      "hospitalName email city state status isVerified",
    ).lean();

    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital profile not found" });
    }

    const [organCounts, sentCounts, receivedCounts, recentRequests] = await Promise.all([
      Organ.aggregate([
        { $match: { hospital: new mongoose.Types.ObjectId(hospitalId) } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      OrganRequest.aggregate([
        { $match: { requestingHospital: new mongoose.Types.ObjectId(hospitalId) } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      OrganRequest.aggregate([
        { $match: { supplyingHospital: new mongoose.Types.ObjectId(hospitalId) } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      OrganRequest.find({
        $or: [{ requestingHospital: hospitalId }, { supplyingHospital: hospitalId }],
      })
        .populate("organ", "organType bloodGroup status")
        .populate("requestingHospital", "hospitalName city")
        .populate("supplyingHospital", "hospitalName city")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const counts = (rows) => Object.fromEntries(rows.map((row) => [row._id, row.count]));
    const organs = counts(organCounts);
    const sent = counts(sentCounts);
    const received = counts(receivedCounts);

    return res.json({
      success: true,
      hospital,
      stats: {
        totalOrgans: Object.values(organs).reduce((sum, value) => sum + value, 0),
        availableOrgans: organs.Available || 0,
        reservedOrgans: organs.Reserved || 0,
        transplantedOrgans: organs.Transplanted || 0,
        expiredOrgans: organs.Expired || 0,
        sentRequests: Object.values(sent).reduce((sum, value) => sum + value, 0),
        pendingSentRequests: sent.Pending || 0,
        receivedRequests: Object.values(received).reduce((sum, value) => sum + value, 0),
        pendingReceivedRequests: received.Pending || 0,
        acceptedRequests: (sent.Accepted || 0) + (received.Accepted || 0),
      },
      recentRequests,
    });
  } catch (error) {
    console.error("Hospital dashboard error:", error);
    return res.status(500).json({ success: false, message: "Server error while loading dashboard" });
  }
};

module.exports = {
  getHospitals,
  getHospitalById,
  getMyProfile,
  getHospitalDashboard,
  updateMyProfile,
  verifyHospital,
};
