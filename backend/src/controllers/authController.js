const Hospital = require("../models/Hospital");
const Admin = require("../models/Admin");
const crypto = require("crypto");

const { hashPassword, comparePassword } = require("../utils/password");

const { generateToken } = require("../utils/jwt");

const {
  validateEmail,
  validateHospitalRegistration,
  validateLogin,
} = require("../validators/authValidator");

const {
  sendHospitalRegistrationEmail,
  sendPasswordResetEmail,
} = require("../services/emailService");

// ==========================================
// HOSPITAL REGISTRATION
// ==========================================

const registerHospital = async (req, res) => {
  try {
    const validationError = validateHospitalRegistration(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const {
      hospitalName,
      email,
      password,
      phone,
      address,
      city,
      state,
      pincode,
      latitude,
      longitude,
    } = req.body;

    const existingHospital = await Hospital.findOne({
      email: email.toLowerCase(),
    });

    if (existingHospital) {
      return res.status(409).json({
        success: false,
        message: "Hospital email already registered",
      });
    }

    const hashedPassword = await hashPassword(password);

    const hospital = await Hospital.create({
      hospitalName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      address,
      city,
      state,
      pincode,
      latitude,
      longitude,

      // New hospitals require admin verification
      isVerified: false,
      status: "Pending",
      role: "hospital",
    });

    try {
      await sendHospitalRegistrationEmail({
        hospitalName: hospital.hospitalName,
        email: hospital.email,
        phone: hospital.phone,
        address: hospital.address,
        city: hospital.city,
        state: hospital.state,
        pincode: hospital.pincode,
        createdAt: hospital.createdAt,
      });
    } catch (emailError) {
      console.error("Email notification failed:", emailError.message);
    }

    return res.status(201).json({
      success: true,
      message:
        "Hospital registered successfully. Wait for administrator verification.",
      hospital: {
        id: hospital._id,
        hospitalName: hospital.hospitalName,
        email: hospital.email,
        status: hospital.status,
        isVerified: hospital.isVerified,
      },
    });
  } catch (error) {
    console.error("Hospital registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// ==========================================
// HOSPITAL LOGIN
// ==========================================

const loginHospital = async (req, res) => {
  try {
    const validationError = validateLogin(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const { email, password } = req.body;

    const hospital = await Hospital.findOne({
      email: email.toLowerCase(),
    });

    if (!hospital) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await comparePassword(password, hospital.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Hospital must be verified by admin
    if (!hospital.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Hospital is not verified by administrator yet",
        status: hospital.status,
      });
    }

    const token = generateToken(hospital);

    return res.status(200).json({
      success: true,
      message: "Hospital login successful",

      token,

      user: {
        id: hospital._id,
        name: hospital.hospitalName,
        email: hospital.email,
        role: hospital.role,
        status: hospital.status,
      },
    });
  } catch (error) {
    console.error("Hospital login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// ==========================================
// ADMIN LOGIN
// ==========================================

const loginAdmin = async (req, res) => {
  try {
    const validationError = validateLogin(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const { email, password } = req.body;

    const admin = await Admin.findOne({
      email: email.toLowerCase(),
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await comparePassword(password, admin.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (admin.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive",
      });
    }

    const token = generateToken(admin);

    return res.status(200).json({
      success: true,
      message: "Admin login successful",

      token,

      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during admin login",
    });
  }
};

// ==========================================
// CURRENT USER
// ==========================================

const getCurrentUser = async (req, res) => {
  try {
    let user;

    if (req.user.role === "hospital") {
      user = await Hospital.findById(req.user.id).select("-password");
    } else if (req.user.role === "admin") {
      user = await Admin.findById(req.user.id).select("-password");
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const requestPasswordReset = async (req, res) => {
  const { email, role = "hospital" } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const genericMessage =
    "If an account exists for this email, a password reset link has been sent.";

  if (!validateEmail(normalizedEmail) || !["hospital", "admin"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "A valid email and account type are required",
    });
  }

  try {
    const Model = role === "admin" ? Admin : Hospital;
    const user = await Model.findOne({ email: normalizedEmail });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
      await user.save();

      try {
        await sendPasswordResetEmail({
          email: user.email,
          token,
          role,
          expiresInMinutes: 15,
        });
      } catch (emailError) {
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        try {
          await user.save();
        } catch (cleanupError) {
          console.error(
            "Password reset token cleanup failed:",
            cleanupError.message,
          );
        }

        console.error(
          "Password reset email failed; inspect SMTP diagnostics above.",
        );
      }
    }

    return res.json({ success: true, message: genericMessage });
  } catch (error) {
    console.error("Password reset request error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to process password reset request",
    });
  }
};

const resetPassword = async (req, res) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token || "").digest("hex");
  const { password, role = "hospital" } = req.body || {};
  if (
    typeof password !== "string" ||
    password.length < 6 ||
    !["hospital", "admin"].includes(role)
  ) {
    return res.status(400).json({ success: false, message: "Choose a valid account type and password of at least 6 characters" });
  }
  const Model = role === "admin" ? Admin : Hospital;
  const user = await Model.findOne({ resetPasswordToken: hashedToken, resetPasswordExpires: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ success: false, message: "Reset token is invalid or expired" });
  user.password = await hashPassword(password);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();
  return res.json({ success: true, message: "Password reset successfully" });
};

module.exports = {
  registerHospital,
  loginHospital,
  loginAdmin,
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
};
