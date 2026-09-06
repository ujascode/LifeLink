const nodemailer = require("nodemailer");

const getEmailConfig = () => {
  const host = process.env.EMAIL_HOST?.trim();
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER?.trim();
  const password = process.env.EMAIL_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL?.trim();

  const missing = [];
  if (!host) missing.push("EMAIL_HOST");
  if (!process.env.EMAIL_PORT) missing.push("EMAIL_PORT");
  if (!user) missing.push("EMAIL_USER");
  if (!password) missing.push("EMAIL_PASSWORD");
  if (!adminEmail) missing.push("ADMIN_EMAIL");

  if (missing.length > 0) {
    throw new Error(
      `Email service is not configured. Missing: ${missing.join(", ")}.`,
    );
  }

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("Email service configuration has an invalid EMAIL_PORT.");
  }

  return {
    host,
    port,
    user,
    password,
    adminEmail,
    secure: process.env.EMAIL_SECURE === "true" || port === 465,
  };
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const displayValue = (value) => value || "Not provided";

const sendHospitalRegistrationEmail = async (hospital) => {
  const config = getEmailConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  const hospitalName = displayValue(hospital.hospitalName);
  const email = displayValue(hospital.email);
  const phone = displayValue(hospital.phone);
  const address = displayValue(hospital.address);
  const city = displayValue(hospital.city);
  const state = displayValue(hospital.state);
  const pincode = displayValue(hospital.pincode);
  const registeredAt = new Date(hospital.createdAt || Date.now()).toISOString();

  return transporter.sendMail({
    from: config.user,
    to: config.adminEmail,
    subject: "LifeLink - New hospital registration",
    text: [
      "A new hospital has registered on LifeLink.",
      "",
      `Hospital: ${hospitalName}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Address: ${address}`,
      `City: ${city}`,
      `State: ${state}`,
      `Pincode: ${pincode}`,
      `Registered at: ${registeredAt}`,
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#172033">
        <h2 style="margin-bottom:8px">New hospital registration</h2>
        <p style="margin-top:0">A hospital is waiting for administrator review on LifeLink.</p>
        <table style="border-collapse:collapse">
          <tbody>
            <tr><td style="padding:4px 16px 4px 0"><strong>Hospital</strong></td><td style="padding:4px 0">${escapeHtml(hospitalName)}</td></tr>
            <tr><td style="padding:4px 16px 4px 0"><strong>Email</strong></td><td style="padding:4px 0">${escapeHtml(email)}</td></tr>
            <tr><td style="padding:4px 16px 4px 0"><strong>Phone</strong></td><td style="padding:4px 0">${escapeHtml(phone)}</td></tr>
            <tr><td style="padding:4px 16px 4px 0"><strong>Address</strong></td><td style="padding:4px 0">${escapeHtml(address)}</td></tr>
            <tr><td style="padding:4px 16px 4px 0"><strong>City</strong></td><td style="padding:4px 0">${escapeHtml(city)}</td></tr>
            <tr><td style="padding:4px 16px 4px 0"><strong>State</strong></td><td style="padding:4px 0">${escapeHtml(state)}</td></tr>
            <tr><td style="padding:4px 16px 4px 0"><strong>Pincode</strong></td><td style="padding:4px 0">${escapeHtml(pincode)}</td></tr>
          </tbody>
        </table>
        <p style="margin-bottom:0;color:#5d6b82">Registered at: ${escapeHtml(registeredAt)}</p>
      </div>
    `,
  });
};

module.exports = { sendHospitalRegistrationEmail };
