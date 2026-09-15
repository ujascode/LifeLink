const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { connectWithRetry } = require("./config/db");

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
  const databaseReady = mongoose.connection.readyState === 1;

  // Always return 200 for the server being up, but include DB status in the response
  res.json({
    success: true, // Server is up
    message: "LifeLink API is running",
    database: databaseReady ? "ready" : "not ready",
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

const startServer = async () => {
  try {
    // Start the server immediately without waiting for DB
    app.listen(PORT, () => {
      console.log(`LifeLink backend running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });

    // Connect to MongoDB with retries in the background
    connectWithRetry().catch((error) => {
      console.error("Failed to connect to MongoDB after retries:", error.message);
      // We don't exit the process because the server is already running
      // The health endpoint will reflect the DB status
    });
  } catch (error) {
    console.error("LifeLink backend startup error:", error);
    process.exitCode = 1;
  }
};

startServer();
