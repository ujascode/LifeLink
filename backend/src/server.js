const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");

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

// ==========================================
// SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`LifeLink backend running on port ${PORT}`);

  console.log(`http://localhost:${PORT}`);
});
