const express = require("express");

const {
  registerHospital,
  loginHospital,
  loginAdmin,
  getCurrentUser,
} = require("../controllers/authController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

// Hospital Registration
router.post("/hospital/register", registerHospital);

// Hospital Login
router.post("/hospital/login", loginHospital);

// Admin Login
router.post("/admin/login", loginAdmin);

// Get Current Logged-In User
router.get("/me", authenticate, getCurrentUser);

module.exports = router;
