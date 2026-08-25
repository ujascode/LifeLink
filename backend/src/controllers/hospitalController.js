const Hospital = require("../models/Hospital");

// ==========================================
// GET ALL HOSPITALS
// ==========================================

const getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find()
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
    const { status } = req.body;

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

    return res.status(200).json({
      success: true,
      message: "Hospital verified successfully",
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

module.exports = {
  getHospitals,
  getHospitalById,
  getMyProfile,
  updateMyProfile,
  verifyHospital,
};
