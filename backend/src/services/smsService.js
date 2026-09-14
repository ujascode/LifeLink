const { v4: uuidv4 } = require('uuid');

/**
 * SMS Service for sending text messages
 * Uses environment variables for configuration:
 * SMS_ENABLED - boolean to enable/disable service
 * SMS_PROVIDER - provider name (e.g., "twilio", "aws-sns")
 * SMS_API_KEY - provider API key
 * SMS_FROM - sender phone number
 */
class SMSService {
  constructor() {
    this.enabled = process.env.SMS_ENABLED === 'true';
    this.provider = process.env.SMS_PROVIDER || '';
    this.apiKey = process.env.SMS_API_KEY || '';
    this.from = process.env.SMS_FROM || '';
    
    if (this.enabled) {
      console.info('[sms] Service initialized with provider:', this.provider);
    } else {
      console.info('[sms] Service disabled');
    }
  }

  /**
   * Normalize phone number to international format
   * @param {string} phone - Phone number to normalize
   * @returns {string|null} - Normalized phone number or null if invalid
   */
  normalizePhoneNumber(phone) {
    if (!phone) return null;
    
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, assume it needs country code
    if (!cleaned.startsWith('+')) {
      // Default to India (+91) if no country code provided
      if (cleaned.length === 10) {
        cleaned = '+91' + cleaned;
      } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
        // Handle numbers with leading 0 (common in some countries)
        cleaned = '+91' + cleaned.substring(1);
      } else {
        // Invalid format
        return null;
      }
    }
    
    // Validate length (basic validation)
    const digitsOnly = cleaned.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return null;
    }
    
    return cleaned;
  }

  /**
   * Send an SMS message
   * @param {string} to - Recipient phone number
   * @param {string} message - Message content
   * @returns {Promise<Object>} - Result object with success status
   */
  async sendMessage(to, message) {
    // Normalize phone number
    const normalizedTo = this.normalizePhoneNumber(to);
    if (!normalizedTo) {
      console.warn('[sms] Invalid phone number:', to);
      return {
        success: false,
        error: 'Invalid phone number',
        channel: 'sms'
      };
    }

    // If service is disabled, return success but don't actually send
    if (!this.enabled) {
      console.info('[sms] Message would be sent (disabled):', {
        to: normalizedTo,
        message: message.substring(0, 50) + (message.length > 50 ? '...' : '')
      });
      return {
        success: true,
        messageId: `sms-disabled-${uuidv4()}`,
        channel: 'sms',
        provider: 'disabled'
      };
    }

    // Check if required configuration is present
    if (!this.apiKey || !this.from) {
      console.error('[sms] Missing configuration');
      return {
        success: false,
        error: 'SMS service not properly configured',
        channel: 'sms'
      };
    }

    try {
      // This is where you would implement the actual provider API call
      // For now, we'll simulate a successful response
      // In production, you'd replace this with actual API calls to SMS provider
      
      console.info('[sms] Sending message:', {
        to: normalizedTo,
        message: message.substring(0, 50) + (message.length > 50 ? '...' : '')
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate successful response
      const messageId = `sms_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      return {
        success: true,
        messageId,
        channel: 'sms',
        provider: this.provider
      };
      
    } catch (error) {
      console.error('[sms] Failed to send message:', error.message);
      return {
        success: false,
        error: error.message,
        channel: 'sms'
      };
    }
  }

  // Template-specific methods for LifeLink events
  
  async sendHospitalVerified(phoneNumber) {
    const message = "Your hospital has been verified and can participate in the LifeLink organ exchange network.";
    return this.sendMessage(phoneNumber, message);
  }

  async sendNewOrganRequest(phoneNumber, requestingHospitalName, organType) {
    const message = `${requestingHospitalName} has requested your ${organType} organ. Please check your LifeLink app for details.`;
    return this.sendMessage(phoneNumber, message);
  }

  async sendRequestAccepted(phoneNumber, organType, supplyingHospitalName) {
    const message = "Your request for a ${organType} organ has been accepted by ${supplyingHospitalName}. Please check your LifeLink app for details.";
    return this.sendMessage(phoneNumber, message);
  }

  async sendRequestRejected(phoneNumber, organType, supplyingHospitalName, responseMessage) {
    const message = `Your request for a ${organType} organ has been rejected by ${supplyingHospitalName}.${responseMessage ? ' Response: ' + responseMessage : ''}`;
    return this.sendMessage(phoneNumber, message);
  }

  async sendRequestCancelled(phoneNumber, requestingHospitalName, organType) {
    const message = `${requestingHospitalName} has cancelled their request for your ${organType} organ.`;
    return this.sendMessage(phoneNumber, message);
  }

  async sendRequestCompleted(phoneNumber, organType) {
    const message = "Your organ request has been marked as completed. Thank you for using LifeLink.";
    return this.sendMessage(phoneNumber, message);
  }
}

module.exports = new SMSService();
