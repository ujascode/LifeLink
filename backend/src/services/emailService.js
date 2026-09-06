const { Resend } = require("resend");

const getRecipientDomain = (recipient) => {
  const value = String(recipient || "");
  const separatorIndex = value.lastIndexOf("@");
  return separatorIndex > -1 ? value.slice(separatorIndex + 1).toLowerCase() : "unknown";
};

const getSafeResendError = (error, recipient) => {
  const sensitiveValues = [
    process.env.RESEND_API_KEY,
    recipient,
    process.env.JWT_SECRET,
  ].filter(Boolean);

  const message = sensitiveValues.reduce(
    (safeMessage, sensitiveValue) =>
      safeMessage.replaceAll(sensitiveValue, "[redacted]"),
    String(error?.message || "Unknown Resend error"),
  );

  return {
    code: error?.name || error?.code || "RESEND_ERROR",
    statusCode: error?.statusCode || error?.status || null,
    message,
  };
};

const logResendEnvironment = ({ apiKey, from, adminEmail }) => {
  console.info("[email] Resend configuration:", {
    "Resend configured": Boolean(apiKey && from),
    "RESEND_API_KEY present": Boolean(apiKey),
    "EMAIL_FROM present": Boolean(from),
    "ADMIN_EMAIL present": Boolean(adminEmail),
    "CLIENT_URL present": Boolean(String(process.env.CLIENT_URL || "").trim()),
  });
};

const getEmailConfig = ({ requireAdminEmail = false } = {}) => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const adminEmail = process.env.ADMIN_EMAIL?.trim();

  logResendEnvironment({ apiKey, from, adminEmail });

  const missing = [];
  if (!apiKey) missing.push("RESEND_API_KEY");
  if (!from) missing.push("EMAIL_FROM");
  if (requireAdminEmail && !adminEmail) missing.push("ADMIN_EMAIL");

  if (missing.length > 0) {
    throw new Error(
      `Email service is not configured. Missing: ${missing.join(", ")}.`,
    );
  }

  return {
    apiKey,
    from,
    adminEmail,
  };
};

const createResendClient = ({ requireAdminEmail = false } = {}) => {
  const config = getEmailConfig({ requireAdminEmail });

  console.info("[email] Resend client initialized.");

  return {
    config,
    resend: new Resend(config.apiKey),
  };
};

const sendEmail = async ({ resend, message, recipient }) => {
  try {
    const { data, error } = await resend.emails.send(message);

    if (error) {
      throw error;
    }

    console.info(
      "[email] Resend send succeeded for recipient domain:",
      getRecipientDomain(recipient),
      "messageIdPresent:",
      Boolean(data?.id),
    );

    return data;
  } catch (error) {
    console.error(
      "[email] Resend send failed:",
      getSafeResendError(error, recipient),
    );
    throw error;
  }
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
  const { config, resend } = createResendClient({ requireAdminEmail: true });

  const hospitalName = displayValue(hospital.hospitalName);
  const email = displayValue(hospital.email);
  const phone = displayValue(hospital.phone);
  const address = displayValue(hospital.address);
  const city = displayValue(hospital.city);
  const state = displayValue(hospital.state);
  const pincode = displayValue(hospital.pincode);
  const registeredAt = new Date(hospital.createdAt || Date.now()).toISOString();

  return sendEmail({
    resend,
    recipient: config.adminEmail,
    message: {
      from: config.from,
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
    },
  });
};

const getFrontendUrl = () => {
  const configuredUrl = (process.env.CLIENT_URL || process.env.FRONTEND_URL || "")
    .trim()
    .replace(/\/+$/, "");

  if (!configuredUrl) {
    throw new Error("Frontend URL is not configured.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(configuredUrl);
  } catch {
    throw new Error("Frontend URL is invalid.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Frontend URL must use HTTP or HTTPS.");
  }

  if (
    process.env.NODE_ENV === "production" &&
    ["localhost", "127.0.0.1"].includes(parsedUrl.hostname)
  ) {
    throw new Error("Production password reset URL cannot use localhost.");
  }

  return configuredUrl;
};

const sendPasswordResetEmail = async ({
  email,
  token,
  role,
  expiresInMinutes = 15,
}) => {
  const { config, resend } = createResendClient();
  const frontendUrl = getFrontendUrl();
  const resetUrl = `${frontendUrl}/reset-password/${encodeURIComponent(token)}?role=${encodeURIComponent(role)}`;

  return sendEmail({
    resend,
    recipient: email,
    message: {
      from: config.from,
      to: email,
      subject: "LifeLink — Password Reset Request",
      text: [
        "LifeLink password reset request",
        "",
        `Use this link to set a new password: ${resetUrl}`,
        `This link expires in ${expiresInMinutes} minutes and can only be used once.`,
        "",
        "If you did not request this reset, you can safely ignore this email.",
      ].join("\n"),
      html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#172033;max-width:560px">
        <div style="display:inline-block;background:#2563eb;color:#fff;font-size:24px;font-weight:700;padding:10px 16px;border-radius:10px;margin-bottom:20px">
          LifeLink
        </div>
        <h2 style="margin:0 0 8px">Password reset request</h2>
        <p style="margin-top:0">We received a request to reset your LifeLink password.</p>
        <p>
          <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px">
            Reset password
          </a>
        </p>
        <p style="color:#5d6b82">
          This secure link expires in ${escapeHtml(expiresInMinutes)} minutes and can only be used once.
        </p>
        <p style="color:#5d6b82;margin-bottom:0">
          If you did not request this reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>
      `,
    },
  });
};

module.exports = { sendHospitalRegistrationEmail, sendPasswordResetEmail };
