require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    const email = "adminlifelink@gmail.com";
    const password = "Admin@123";

    // Check whether admin already exists
    const existingAdmin = await Admin.findOne({
      email: email.toLowerCase(),
    });

    if (existingAdmin) {
      console.log("Admin already exists:");
      console.log(existingAdmin.email);

      await mongoose.disconnect();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await Admin.create({
      name: "LifeLink Administrator",
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin",
    });

    console.log("=================================");
    console.log("Admin created successfully");
    console.log("=================================");
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);
    console.log("Password: Admin@123");
    console.log("=================================");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error creating admin:");
    console.error(error);

    await mongoose.disconnect();
    process.exit(1);
  }
};

createAdmin();
