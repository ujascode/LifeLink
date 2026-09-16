const Hospital = require("../models/Hospital");
const Organ = require("../models/Organ");
const OrganRequest = require("../models/OrganRequest");
const mongoose = require("mongoose");
const notificationService = require("../services/notificationService");
const https = require("https");

// ==========================================
// GET ALL HOSPITALS
// ==========================================

const getHospitals = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : {
            status: "Verified",
            isVerified: true,
          };

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
      return res.status(400).json({
        success: false,
        message: "Invalid hospital id",
      });
    }

    // Hospital users can only view their own profile
    if (
      req.user.role === "hospital" &&
      req.user.id.toString() !== req.params.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own hospital profile",
      });
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
// GET NEARBY HOSPITALS
// ==========================================

const getNearbyHospitals = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    const lat = Number(latitude);
    const lng = Number(longitude);
    const rad = Number(radius);

    // Validate latitude
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude. Must be a number between -90 and 90.",
      });
    }

    // Validate longitude
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid longitude. Must be a number between -180 and 180.",
      });
    }

    // Validate radius
    if (!Number.isFinite(rad) || rad <= 0 || rad > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid radius. Must be a positive number between 0 and 100 km.",
      });
    }

    // Only verified hospitals
    const hospitals = await Hospital.find({
      status: "Verified",
      isVerified: true,
    })
      .select(
        "_id hospitalName email phone address city state latitude longitude",
      )
      .lean();

    if (!hospitals || hospitals.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        hospitals: [],
      });
    }

    // Haversine distance calculation
    const R = 6378.1;

    const hospitalsWithDistance = hospitals
      .map((hospital) => {
        const hospitalLat = Number(hospital.latitude);
        const hospitalLng = Number(hospital.longitude);

        if (!Number.isFinite(hospitalLat) || !Number.isFinite(hospitalLng)) {
          return null;
        }

        const dLat = ((hospitalLat - lat) * Math.PI) / 180;

        const dLng = ((hospitalLng - lng) * Math.PI) / 180;

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat * Math.PI) / 180) *
            Math.cos((hospitalLat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c;

        if (distance > rad) {
          return null;
        }

        return {
          id: hospital._id,
          hospitalName: hospital.hospitalName,
          city: hospital.city,
          state: hospital.state,
          address: hospital.address,
          phone: hospital.phone,
          latitude: hospitalLat,
          longitude: hospitalLng,
          distance: Number(distance.toFixed(2)),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance);

    // Maximum 50 results
    const limitedHospitals = hospitalsWithDistance.slice(0, 50);

    return res.status(200).json({
      success: true,
      count: limitedHospitals.length,
      hospitals: limitedHospitals,
    });
  } catch (error) {
    console.error("Get nearby hospitals error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching nearby hospitals",
    });
  }
};

// ==========================================
// GEOCODING USING NOMINATIM / OPENSTREETMAP
// ==========================================

const geocodeLocation = async (city, state) => {
  return new Promise((resolve, reject) => {
    const query = encodeURIComponent(`${city}, ${state}`);

    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?format=json` +
      `&q=${query}` +
      `&limit=1` +
      `&addressdetails=1`;

    const request = https.get(
      url,
      {
        headers: {
          "User-Agent": "LifeLink/1.0 (hospital-organ-exchange-platform)",
          Accept: "application/json",
        },
      },
      (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          try {
            if (response.statusCode !== 200) {
              reject(
                new Error(`Nominatim returned status ${response.statusCode}`),
              );
              return;
            }

            const parsedData = JSON.parse(data);

            if (!Array.isArray(parsedData) || parsedData.length === 0) {
              resolve(null);
              return;
            }

            const result = parsedData[0];

            const latitude = Number(result.lat);
            const longitude = Number(result.lon);

            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
              reject(
                new Error("Invalid coordinates returned by geocoding service"),
              );
              return;
            }

            resolve({
              latitude,
              longitude,
              displayName: result.display_name,
            });
          } catch (error) {
            reject(
              new Error(`Failed to parse geocoding response: ${error.message}`),
            );
          }
        });
      },
    );

    request.on("error", (error) => {
      reject(new Error(`Error with geocoding request: ${error.message}`));
    });

    request.setTimeout(5000, () => {
      request.destroy();
      reject(new Error("Geocoding request timeout"));
    });
  });
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

    // Validate hospital name
    if (
      hospitalName !== undefined &&
      (!String(hospitalName).trim() || String(hospitalName).length > 160)
    ) {
      return res.status(400).json({
        success: false,
        message: "Hospital name must be between 1 and 160 characters",
      });
    }

    // Validate coordinates when provided
    if (latitude !== undefined) {
      const lat = Number(latitude);

      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        return res.status(400).json({
          success: false,
          message: "Invalid latitude. Must be between -90 and 90.",
        });
      }

      hospital.latitude = lat;
    }

    if (longitude !== undefined) {
      const lng = Number(longitude);

      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: "Invalid longitude. Must be between -180 and 180.",
        });
      }

      hospital.longitude = lng;
    }

    if (hospitalName !== undefined) {
      hospital.hospitalName = String(hospitalName).trim();
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
      return res.status(400).json({
        success: false,
        message: "Invalid hospital id",
      });
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

    // Notify hospital/admin after successful update.
    // Notification failure should not make verification fail.
    try {
      if (status === "Verified") {
        await notificationService.sendHospitalNotification({
          hospitalId: hospital._id,
          event: "HospitalVerified",
          data: {
            title: "Hospital verification complete",
            message:
              "Your hospital is now verified and can participate in organ exchange.",
          },
        });

        if (typeof notificationService.sendAdminNotification === "function") {
          await notificationService.sendAdminNotification({
            adminId: req.user.id,
            event: "HospitalVerified",
            data: {
              title: "Hospital verification complete",
              message: "Hospital verification completed successfully.",
            },
          });
        }
      }
    } catch (notificationError) {
      console.error(
        "Hospital verification notification error:",
        notificationError,
      );
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

    if (!mongoose.isValidObjectId(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hospital id",
      });
    }

    const objectId = new mongoose.Types.ObjectId(hospitalId);

    const hospital = await Hospital.findById(hospitalId)
      .select("hospitalName email city state status isVerified")
      .lean();

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital profile not found",
      });
    }

    const [organCounts, sentCounts, receivedCounts, recentRequests] =
      await Promise.all([
        // Hospital-owned organ counts
        Organ.aggregate([
          {
            $match: {
              hospital: objectId,
            },
          },
          {
            $group: {
              _id: "$status",
              count: {
                $sum: 1,
              },
            },
          },
        ]),

        // Sent request counts
        OrganRequest.aggregate([
          {
            $match: {
              requestingHospital: objectId,
            },
          },
          {
            $group: {
              _id: "$status",
              count: {
                $sum: 1,
              },
            },
          },
        ]),

        // Received request counts
        OrganRequest.aggregate([
          {
            $match: {
              supplyingHospital: objectId,
            },
          },
          {
            $group: {
              _id: "$status",
              count: {
                $sum: 1,
              },
            },
          },
        ]),

        // Recent requests
        OrganRequest.find({
          $or: [
            {
              requestingHospital: objectId,
            },
            {
              supplyingHospital: objectId,
            },
          ],
        })
          .populate("organ", "organType bloodGroup status")
          .populate("requestingHospital", "hospitalName city")
          .populate("supplyingHospital", "hospitalName city")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      ]);

    const counts = (rows) =>
      Object.fromEntries(rows.map((row) => [row._id, row.count]));

    const organs = counts(organCounts);
    const sent = counts(sentCounts);
    const received = counts(receivedCounts);

    return res.status(200).json({
      success: true,
      hospital,

      stats: {
        totalOrgans: Object.values(organs).reduce(
          (sum, value) => sum + value,
          0,
        ),

        availableOrgans: organs.Available || 0,

        reservedOrgans: organs.Reserved || 0,

        transplantedOrgans: organs.Transplanted || 0,

        expiredOrgans: organs.Expired || 0,

        sentRequests: Object.values(sent).reduce(
          (sum, value) => sum + value,
          0,
        ),

        pendingSentRequests: sent.Pending || 0,

        receivedRequests: Object.values(received).reduce(
          (sum, value) => sum + value,
          0,
        ),

        pendingReceivedRequests: received.Pending || 0,

        acceptedRequests: (sent.Accepted || 0) + (received.Accepted || 0),
      },

      recentRequests,
    });
  } catch (error) {
    console.error("Hospital dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while loading dashboard",
    });
  }
};

// ==========================================
// GEOCODE CONTROLLER
// ==========================================

const geocode = async (req, res) => {
  try {
    const { city, state } = req.query;

    if (!city || !state) {
      return res.status(400).json({
        success: false,
        message: "City and state are required for geocoding",
      });
    }

    const result = await geocodeLocation(
      String(city).trim(),
      String(state).trim(),
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Geocoding error:", error);

    return res.status(500).json({
      success: false,
      message: "Geocoding service error",
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  getHospitals,
  getHospitalById,
  getMyProfile,
  getHospitalDashboard,
  updateMyProfile,
  verifyHospital,
  getNearbyHospitals,
  geocodeLocation,
  geocode,
};
