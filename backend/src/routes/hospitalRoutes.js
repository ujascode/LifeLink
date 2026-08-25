const express = require("express");

const {
  getHospitals,
  getHospitalById,
  getMyProfile,
  updateMyProfile,
  verifyHospital,
} = require("../controllers/hospitalController");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Logged-in hospital profile
router.get(
  "/profile/me",
  authenticate,
  authorizeRoles("hospital"),
  getMyProfile,
);

// Update logged-in hospital profile
router.put(
  "/profile",
  authenticate,
  authorizeRoles("hospital"),
  updateMyProfile,
);

// Admin verification
router.put(
  "/:id/verify",
  authenticate,
  authorizeRoles("admin"),
  verifyHospital,
);

// Get hospital by ID
router.get("/:id", authenticate, getHospitalById);

// Get all hospitals
router.get("/", authenticate, getHospitals);

module.exports = router;
