const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");
const organRoutes = require("./routes/organRoutes");
const organRequestRoutes = require("./routes/organRequestRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// ==========================================
// DATABASE
// ==========================================

connectDB();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "LifeLink API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "LifeLink API is healthy",
  });
});

// ==========================================
// API ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

app.use("/api/hospitals", hospitalRoutes);

app.use("/api/organs", organRoutes);

app.use("/api/organ-requests", organRequestRoutes);
app.use("/api/admin", adminRoutes);

app.use((error, req, res, next) => {
  if (error?.name === "ValidationError" || error?.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid request data" });
  }
  console.error("Unhandled API error:", error);
  return res.status(500).json({ success: false, message: "Internal server error" });
});
// ==========================================
// SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`LifeLink backend running on port ${PORT}`);

  console.log(`http://localhost:${PORT}`);
});
