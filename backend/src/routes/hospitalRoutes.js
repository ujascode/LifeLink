const express = require("express");

const {
  getHospitals,
  getHospitalById,
  getMyProfile,
  getHospitalDashboard,
  updateMyProfile,
  verifyHospital,
} = require("../controllers/hospitalController");

const { authenticate } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// GET LOGGED-IN HOSPITAL PROFILE
router.get(
  "/profile/me",
  authenticate,
  authorizeRoles("hospital"),
  getMyProfile,
);

// UPDATE LOGGED-IN HOSPITAL PROFILE
router.put(
  "/profile",
  authenticate,
  authorizeRoles("hospital"),
  updateMyProfile,
);

// GET HOSPITAL DASHBOARD
router.get(
  "/dashboard",
  authenticate,
  authorizeRoles("hospital"),
  getHospitalDashboard,
);

// VERIFY HOSPITAL
// ADMIN ONLY
router.put(
  "/:id/verify",
  authenticate,
  authorizeRoles("admin"),
  verifyHospital,
);

// GET HOSPITAL BY ID
router.get("/:id", authenticate, getHospitalById);

// GET ALL HOSPITALS
router.get("/", authenticate, getHospitals);

module.exports = router;
