const mongoose = require("mongoose");
const Hospital = require("../models/Hospital");
const Organ = require("../models/Organ");
const OrganRequest = require("../models/OrganRequest");

const getAdminDashboard = async (req, res) => {
  try {
    const [hospitalCounts, organCounts, requestCounts, recentHospitals, recentRequests] =
      await Promise.all([
        Hospital.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Organ.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        OrganRequest.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Hospital.find().select("hospitalName email city state status isVerified createdAt").sort({ createdAt: -1 }).limit(5).lean(),
        OrganRequest.find().populate("organ", "organType bloodGroup status").populate("requestingHospital", "hospitalName city").populate("supplyingHospital", "hospitalName city").sort({ createdAt: -1 }).limit(8).lean(),
      ]);

    const toCounts = (rows) => Object.fromEntries(rows.map((row) => [row._id, row.count]));
    const hospitals = toCounts(hospitalCounts);
    const organs = toCounts(organCounts);
    const requests = toCounts(requestCounts);

    return res.json({
      success: true,
      stats: {
        totalHospitals: Object.values(hospitals).reduce((sum, value) => sum + value, 0),
        pendingHospitals: hospitals.Pending || 0,
        verifiedHospitals: hospitals.Verified || 0,
        totalOrgans: Object.values(organs).reduce((sum, value) => sum + value, 0),
        availableOrgans: organs.Available || 0,
        reservedOrgans: organs.Reserved || 0,
        transplantedOrgans: organs.Transplanted || 0,
        totalRequests: Object.values(requests).reduce((sum, value) => sum + value, 0),
        pendingRequests: requests.Pending || 0,
        acceptedRequests: requests.Accepted || 0,
        completedRequests: requests.Completed || 0,
        rejectedRequests: requests.Rejected || 0,
      },
      recentHospitals,
      recentRequests,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return res.status(500).json({ success: false, message: "Server error while loading admin dashboard" });
  }
};

const getAdminRequests = async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const requests = await OrganRequest.find(filter)
      .populate("organ", "organType bloodGroup status")
      .populate("requestingHospital", "hospitalName city state")
      .populate("supplyingHospital", "hospitalName city state")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    console.error("Admin requests error:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching requests" });
  }
};

const getAdminRequestById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid request id" });
  }
  const request = await OrganRequest.findById(req.params.id)
    .populate("organ")
    .populate("requestingHospital", "hospitalName email phone city state")
    .populate("supplyingHospital", "hospitalName email phone city state")
    .lean();
  if (!request) return res.status(404).json({ success: false, message: "Organ request not found" });
  return res.json({ success: true, request });
};

module.exports = { getAdminDashboard, getAdminRequests, getAdminRequestById };
