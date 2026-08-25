const express = require("express");

const {
  createOrganRequest,
  getSentRequests,
  getReceivedRequests,
  getOrganRequestById,
  respondToOrganRequest,
  cancelOrganRequest,
  completeOrganRequest,
} = require("../controllers/organRequestController");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// SEND ORGAN REQUEST
// ==========================================

router.post("/", authenticate, authorizeRoles("hospital"), createOrganRequest);

// ==========================================
// SENT REQUESTS
// ==========================================

router.get("/sent", authenticate, authorizeRoles("hospital"), getSentRequests);

// ==========================================
// RECEIVED REQUESTS
// ==========================================

router.get(
  "/received",
  authenticate,
  authorizeRoles("hospital"),
  getReceivedRequests,
);

// ==========================================
// GET REQUEST BY ID
// ==========================================

router.get(
  "/:id",
  authenticate,
  authorizeRoles("hospital"),
  getOrganRequestById,
);

// ==========================================
// ACCEPT / REJECT REQUEST
// ==========================================

router.put(
  "/:id/respond",
  authenticate,
  authorizeRoles("hospital"),
  respondToOrganRequest,
);

// ==========================================
// CANCEL REQUEST
// ==========================================

router.put(
  "/:id/cancel",
  authenticate,
  authorizeRoles("hospital"),
  cancelOrganRequest,
);

// ==========================================
// COMPLETE REQUEST
// ==========================================

router.put(
  "/:id/complete",
  authenticate,
  authorizeRoles("hospital"),
  completeOrganRequest,
);

module.exports = router;
