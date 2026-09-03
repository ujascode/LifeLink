const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
  getAdminDashboard,
  getAdminRequests,
  getAdminRequestById,
} = require("../controllers/adminController");

const router = express.Router();
router.use(authenticate, authorizeRoles("admin"));
router.get("/dashboard", getAdminDashboard);
router.get("/requests", getAdminRequests);
router.get("/requests/:id", getAdminRequestById);

module.exports = router;
