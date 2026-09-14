const Notification = require("../models/Notification");
const Hospital = require("../models/Hospital");
const Admin = require("../models/Admin");
const emailService = require("./emailService");
const whatsappService = require("./whatsappService");
const smsService = require("./smsService");

/**
 * Centralized notification service for LifeLink
 * Handles multi-channel notifications with independent failure handling
 */
class NotificationService {
  /**
   * Send a notification to a hospital via multiple channels
   * @param {Object} params - Notification parameters
   * @param {string} params.hospitalId - Hospital ID
   * @param {string} params.event - Event type (matches Notification.type enum)
   * @param {Object} params.data - Data for the notification template
   * @returns {Promise<void>}
   */
  async sendHospitalNotification({ hospitalId, event, data }) {
    try {
      // Load hospital
      const hospital = await Hospital.findById(hospitalId);
      if (!hospital) {
        console.error('[notification] Hospital not found:', hospitalId);
        return;
      }

      // Check if hospital wants in-app notifications
      const wantsInApp = hospital.notificationPreferences?.inApp !== false;
      
      // Create in-app notification if preferred
      if (wantsInApp) {
        await this.createInAppNotification({
          recipientHospital: hospital._id,
          event,
          data
        });
      }

      // Send notifications via other channels independently
      // Use Promise.allSettled so one failure doesn't block others
      await Promise.allSettled([
        this.sendEmailIfPreferred(hospital, event, data),
        this.sendWhatsAppIfPreferred(hospital, event, data),
        this.sendSMSIfPreferred(hospital, event, data)
      ]);
      
    } catch (error) {
      // Never let notification failures break the main workflow
      console.error('[notification] Failed to send hospital notification:', error.message);
    }
  }
  /**
   * Send a notification to an admin via multiple channels
   * @param {Object} params - Notification parameters
   * @param {string} params.adminId - Admin ID
   * @param {string} params.event - Event type (matches Notification.type enum)
   * @param {Object} params.data - Data for the notification template
   * @returns {Promise<void>}
   */
  async sendAdminNotification({ adminId, event, data }) {
    try {
      // Load admin
      const admin = await Admin.findById(adminId);
      if (!admin) {
        console.error('[notification] Admin not found:', adminId);
        return;
      }

      // Check if admin wants in-app notifications
      const wantsInApp = admin.notificationPreferences?.inApp !== false;
      
      // Create in-app notification if preferred
      if (wantsInApp) {
        await this.createInAppNotification({
          recipientAdmin: admin._id,
          event,
          data
        });
      }

      // Send notifications via other channels independently
      await Promise.allSettled([
        this.sendEmailIfPreferred(admin, event, data),
        this.sendWhatsAppIfPreferred(admin, event, data),
        this.sendSMSIfPreferred(admin, event, data)
      ]);
      
    } catch (error) {
      // Never let notification failures break the main workflow
      console.error('[notification] Failed to send admin notification:', error.message);
    }
  }
  /**
   * Create an in-app notification in the database
   * @param {Object} params - Notification parameters
   * @returns {Promise<Document>} - Created notification document
   */
  async createInAppNotification(params) {
    try {
      const notification = new Notification(params);
      return await notification.save();
    } catch (error) {
      console.error('[notification] Failed to create in-app notification:', error.message);
      throw error;
    }
  }

  /**
   * Send email notification if preferred and configured
   * @param {Object} recipient - Hospital or Admin document
   * @param {string} event - Event type
   * @param {Object} data - Data for the notification template
   * @returns {Promise<Object>} - Result object
   */
  async sendEmailIfPreferred(recipient, event, data) {
    try {
      // Check if recipient wants email notifications
      const wantsEmail = recipient.notificationPreferences?.email !== false;
      if (!wantsEmail) {
        return { skipped: true, reason: 'Email notifications disabled' };
      }

      // Check if email service is configured
      const isEmailConfigured = !!(
        process.env.RESEND_API_KEY && 
        process.env.EMAIL_FROM
      );
      if (!isEmailConfigured) {
        return { skipped: true, reason: 'Email service not configured' };
      }

      // Determine recipient email
      const recipientEmail = recipient.email;
      if (!recipientEmail) {
        return { skipped: true, reason: 'No email address' };
      }

      // Generate email content based on event
      const emailContent = this.generateEmailContent(event, data, recipientEmail);
      if (!emailContent) {
        return { skipped: true, reason: 'No email template for event' };
      }

      // Send email
      const result = await emailService.sendEmail(emailContent);
      return {
        success: true,
        channel: 'email',
        ...result
      };
    } catch (error) {
      console.error('[notification] Email notification failed:', error.message);
      return {
        success: false,
        channel: 'email',
        error: error.message
      };
    }
  }
  /**
   * Send WhatsApp notification if preferred and configured
   * @param {Object} recipient - Hospital or Admin document
   * @param {string} event - Event type
   * @param {Object} data - Data for the notification template
   * @returns {Promise<Object>} - Result object
   */
  async sendWhatsAppIfPreferred(recipient, event, data) {
    try {
      // Check if recipient wants WhatsApp notifications
      const wantsWhatsApp = recipient.notificationPreferences?.whatsapp !== false;
      if (!wantsWhatsApp) {
        return { skipped: true, reason: 'WhatsApp notifications disabled' };
      }

      // Check if WhatsApp service is configured
      const isWhatsAppConfigured = !!(
        process.env.WHATSAPP_ENABLED === 'true' &&
        process.env.WHATSAPP_ACCESS_TOKEN &&
        process.env.WHATSAPP_PHONE_NUMBER_ID
      );
      if (!isWhatsAppConfigured) {
        return { skipped: true, reason: 'WhatsApp service not configured' };
      }

      // Determine recipient phone number
      const recipientPhone = recipient.phone;
      if (!recipientPhone) {
        return { skipped: true, reason: 'No phone number' };
      }

      // Generate WhatsApp content based on event
      const whatsAppContent = this.generateWhatsAppContent(event, data);
      if (!whatsAppContent) {
        return { skipped: true, reason: 'No WhatsApp template for event' };
      }

      // Send WhatsApp message
      const result = await whatsappService.sendTemplateMessage(
        recipientPhone,
        whatsAppContent.templateName,
        whatsAppContent.templateParams
      );
      return {
        success: true,
        channel: 'whatsapp',
        ...result
      };
    } catch (error) {
      console.error('[notification] WhatsApp notification failed:', error.message);
      return {
        success: false,
        channel: 'whatsapp',
        error: error.message
      };
    }
  }

  /**
   * Send SMS notification if preferred and configured
   * @param {Object} recipient - Hospital or Admin document
   * @param {string} event - Event type
   * @param {Object} data - Data for the notification template
   * @returns {Promise<Object>} - Result object
   */
  async sendSMSIfPreferred(recipient, event, data) {
    try {
      // Check if recipient wants SMS notifications
      const wantsSMS = recipient.notificationPreferences?.sms !== false;
      if (!wantsSMS) {
        return { skipped: true, reason: 'SMS notifications disabled' };
      }

      // Check if SMS service is configured
      const isSMSConfigured = !!(
        process.env.SMS_ENABLED === 'true' &&
        process.env.SMS_API_KEY &&
        process.env.SMS_FROM
      );
      if (!isSMSConfigured) {
        return { skipped: true, reason: 'SMS service not configured' };
      }

      // Determine recipient phone number
      const recipientPhone = recipient.phone;
      if (!recipientPhone) {
        return { skipped: true, reason: 'No phone number' };
      }

      // Generate SMS content based on event
      const smsContent = this.generateSMSContent(event, data);
      if (!smsContent) {
        return { skipped: true, reason: 'No SMS template for event' };
      }

      // Send SMS message
      const result = await smsService.sendMessage(
        recipientPhone,
        smsContent
      );
      return {
        success: true,
        channel: 'sms',
        ...result
      };
    } catch (error) {
      console.error('[notification] SMS notification failed:', error.message);
      return {
        success: false,
        channel: 'sms',
        error: error.message
      };
    }
  }
  /**
   * Generate email content for an event
   * @param {string} event - Event type
   * @param {Object} data - Event data
   * @param {string} recipientEmail - Recipient email address
   * @returns {Object|null} - Email message object or null if no template
   */
  generateEmailContent(event, data, recipientEmail) {
    // Reuse existing email service templates where possible
    switch (event) {
      case "NewRequest":
        // For new organ requests, we want to email the supplying hospital
        // This would be handled when calling sendHospitalNotification with the supplying hospital
        return null; // Handled by specific logic in controllers if needed
       
      case "RequestApproved":
      case "RequestRejected":
      case "RequestUpdated":
        // These would typically use the same email templates as in-app
        // For now, we'll create a simple notification email
        return {
          from: process.env.EMAIL_FROM,
          to: recipientEmail,
          subject: `LifeLink - ${this.eventToTitle(event)}`,
          text: data.message,
          html: `<div>${data.message}</div>`
        };
        
      case "HospitalVerified":
        // This is similar to the existing hospital verification email but to the hospital itself
        return {
          from: process.env.EMAIL_FROM,
          to: recipientEmail,
          subject: "LifeLink - Hospital Verified",
          text: `Your hospital is now verified and can participate in organ exchange.`,
          html: `<div>Your hospital is now verified and can participate in organ exchange.</div>`
        };
        
      case "HospitalRegistration":
        // Notify admins about a new hospital registration
        return {
          from: process.env.EMAIL_FROM,
          to: recipientEmail,
          subject: "LifeLink - New Hospital Registration Pending Approval",
          text: `A new hospital has registered on LifeLink and is pending administrator approval.

Hospital Name: ${data.hospitalName || "Unknown"}
Email: ${data.email || "Not provided"}
Phone: ${data.phone || "Not provided"}
Address: ${data.address || "Not provided"}, ${data.city || "Not provided"}, ${data.state || "Not provided"} ${data.pincode || "Not provided"}

Registered at: ${new Date(data.createdAt || Date.now()).toISOString()}

Please review this registration in the admin dashboard.`,
          html: `<div>A new hospital has registered on LifeLink and is pending administrator approval.<br><br>Hospital Name: ${data.hospitalName || "Unknown"}<br>Email: ${data.email || "Not provided"}<br>Phone: ${data.phone || "Not provided"}<br>Address: ${data.address || "Not provided"}, ${data.city || "Not provided"}, ${data.state || "Not provided"} ${data.pincode || "Not provided"}<br><br>Registered at: ${new Date(data.createdAt || Date.now()).toISOString()}<br><br>Please review this registration in the admin dashboard.</div>`
        };


      default:
        return null;
    }
  }

  /**
   * Generate WhatsApp content for an event
   * @param {string} event - Event type
   * @param {Object} data - Event data
   * @returns {Object|null} - WhatsApp template content or null if no template
   */
  generateWhatsAppContent(event, data) {
    // Map events to WhatsApp template names
    switch (event) {
      case "NewRequest":
        return {
          templateName: "new_organ_request",
          templateParams: {
            requestingHospitalName: data.requestingHospitalName || "Another hospital",
            organType: data.organType || "organ"
          }
        };
        
      case "RequestApproved":
        return {
          templateName: "request_accepted",
          templateParams: {
            organType: data.organType || "organ",
            supplyingHospitalName: data.supplyingHospitalName || "the supplying hospital"
          }
        };
        
      case "RequestRejected":
        return {
          templateName: "request_rejected",
          templateParams: {
            organType: data.organType || "organ",
            supplyingHospitalName: data.supplyingHospitalName || "the supplying hospital",
            responseMessage: data.responseMessage || "No additional message provided"
          }
        };
        
      case "RequestUpdated":
        if (data.type === "cancelled" || data.title?.toLowerCase().includes("cancelled")) {
          return {
            templateName: "request_cancelled",
            templateParams: {
              requestingHospitalName: data.requestingHospitalName || "Another hospital",
              organType: data.organType || "organ"
            }
          };
        } else if (data.type === "completed" || data.title?.toLowerCase().includes("completed")) {
          return {
            templateName: "request_completed",
            templateParams: {
              organType: data.organType || "organ"
            }
          };
        }
        break;
        
      case "HospitalRegistration":
        return {
          templateName: "hospital_registration",
          templateParams: {}
        };

      case "HospitalVerified":
        return {
          templateName: "hospital_verified",
          templateParams: {}
        };

      default:
        return null;
    }
  }

  /**
   * Generate SMS content for an event
   * @param {string} event - Event type
   * @param {Object} data - Event data
   * @returns {string|null} - SMS message or null if no template
   */
  generateSMSContent(event, data) {
    switch (event) {
      case "NewRequest":
        return `${data.requestingHospitalName || "Another hospital"} has requested your ${data.organType || "organ"} organ. Please check your LifeLink app for details.`;
        
      case "RequestApproved":
        return `Your request for a ${data.organType || "organ"} organ has been accepted by ${data.supplyingHospitalName || "the supplying hospital"}. Please check your LifeLink app for details.`;
        
      case "RequestRejected":
        const responsePart = data.responseMessage ? ` Response: ${data.responseMessage}` : '';
        return `Your request for a ${data.organType || "organ"} organ has been rejected by ${data.supplyingHospitalName || "the supplying hospital"}.${responsePart}`;
        
      case "RequestUpdated":
        if (data.type === "cancelled" || data.title?.toLowerCase().includes("cancelled")) {
          return `${data.requestingHospitalName || "Another hospital"} has cancelled their request for your ${data.organType || "organ"} organ.`;
        } else if (data.type === "completed" || data.title?.toLowerCase().includes("completed")) {
          return "Your organ request has been marked as completed. Thank you for using LifeLink.";
        }
        break;
        
      case "HospitalVerified":
        return "Your hospital has been verified and can participate in the LifeLink organ exchange network.";
        
      default:
        return null;
    }
  }

  /**
   * Convert event type to human-readable title
   * @param {string} event - Event type
   * @returns {string} - Human-readable title
   */
  eventToTitle(event) {
    switch (event) {
      case "NewRequest": return "New Organ Request";
      case "RequestApproved": return "Organ Request Accepted";
      case "RequestRejected": return "Organ Request Rejected";
      case "RequestUpdated": return "Organ Request Updated";
      case "HospitalVerified": return "Hospital Verified";
      default: return event;
    }
  }
}

module.exports = new NotificationService();
