const express = require("express");

const {
  createOrgan,
  getOrgans,
  getOrganById,
  updateOrgan,
  deleteOrgan,
} = require("../controllers/organController");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// GET ALL AVAILABLE ORGANS
// ==========================================

router.get("/", authenticate, getOrgans);

// ==========================================
// ADD ORGAN
// ==========================================

router.post("/", authenticate, authorizeRoles("hospital"), createOrgan);

// ==========================================
// GET ORGAN BY ID
// ==========================================

router.get("/:id", authenticate, getOrganById);

// ==========================================
// UPDATE ORGAN
// ==========================================

router.put("/:id", authenticate, authorizeRoles("hospital"), updateOrgan);

// ==========================================
// DELETE ORGAN
// ==========================================

router.delete("/:id", authenticate, authorizeRoles("hospital"), deleteOrgan);

module.exports = router;
