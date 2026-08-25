const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "LifeLink API is running",
  });
});

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "LifeLink API is healthy",
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`LifeLink backend running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
