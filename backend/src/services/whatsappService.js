const { v4: uuidv4 } = require('uuid');

/**
 * WhatsApp Service for sending template messages
 * Uses environment variables for configuration:
 * WHATSAPP_ENABLED - boolean to enable/disable service
 * WHATSAPP_PROVIDER - provider name (e.g., "meta", "twilio")
 * WHATSAPP_ACCESS_TOKEN - provider access token
 * WHATSAPP_PHONE_NUMBER_ID - phone number ID for the sender
 */
class WhatsAppService {
  constructor() {
    this.enabled = process.env.WHATSAPP_ENABLED === 'true';
    this.provider = process.env.WHATSAPP_PROVIDER || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    
    if (this.enabled) {
      console.info('[whatsapp] Service initialized with provider:', this.provider);
    } else {
      console.info('[whatsapp] Service disabled');
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
      // In a production app, you might want to detect country from address or make this configurable
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
   * Send a WhatsApp template message
   * @param {string} to - Recipient phone number
   * @param {string} templateName - Name of the template to use
   * @param {Object} templateParams - Parameters for the template
   * @returns {Promise<Object>} - Result object with success status
   */
  async sendTemplateMessage(to, templateName, templateParams = {}) {
    // Normalize phone number
    const normalizedTo = this.normalizePhoneNumber(to);
    if (!normalizedTo) {
      console.warn('[whatsapp] Invalid phone number:', to);
      return {
        success: false,
        error: 'Invalid phone number',
        channel: 'whatsapp'
      };
    }

    // If service is disabled, return success but don't actually send
    if (!this.enabled) {
      console.info('[whatsapp] Message would be sent (disabled):', {
        to: normalizedTo,
        template: templateName,
        params: templateParams
      });
      return {
        success: true,
        messageId: `whatsapp-disabled-${uuidv4()}`,
        channel: 'whatsapp',
        provider: 'disabled'
      };
    }

    // Check if required configuration is present
    if (!this.accessToken || !this.phoneNumberId) {
      console.error('[whatsapp] Missing configuration');
      return {
        success: false,
        error: 'WhatsApp service not properly configured',
        channel: 'whatsapp'
      };
    }

    try {
      // This is where you would implement the actual provider API call
      // For now, we'll simulate a successful response
      // In production, you'd replace this with actual API calls to WhatsApp Business Platform
      
      console.info('[whatsapp] Sending template message:', {
        to: normalizedTo,
        template: templateName,
        params: templateParams
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate successful response
      const messageId = `whatsapp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      return {
        success: true,
        messageId,
        channel: 'whatsapp',
        provider: this.provider
      };
      
    } catch (error) {
      console.error('[whatsapp] Failed to send message:', error.message);
      return {
        success: false,
        error: error.message,
        channel: 'whatsapp'
      };
    }
  }

  // Template-specific methods for LifeLink events
  
  async sendHospitalVerified(phoneNumber) {
    return this.sendTemplateMessage(
      phoneNumber,
      'hospital_verified',
      {}
    );
  }

  async sendNewOrganRequest(phoneNumber, requestingHospitalName, organType) {
    return this.sendTemplateMessage(
      phoneNumber,
      'new_organ_request',
      {
        requestingHospitalName,
        organType
      }
    );
  }

  async sendRequestAccepted(phoneNumber, organType, supplyingHospitalName) {
    return this.sendTemplateMessage(
      phoneNumber,
      'request_accepted',
      {
        organType,
        supplyingHospitalName
      }
    );
  }

  async sendRequestRejected(phoneNumber, organType, supplyingHospitalName, responseMessage) {
    return this.sendTemplateMessage(
      phoneNumber,
      'request_rejected',
      {
        organType,
        supplyingHospitalName,
        responseMessage: responseMessage || 'No additional message'
      }
    );
  }

  async sendRequestCancelled(phoneNumber, requestingHospitalName, organType) {
    return this.sendTemplateMessage(
      phoneNumber,
      'request_cancelled',
      {
        requestingHospitalName,
        organType
      }
    );
  }

  async sendRequestCompleted(phoneNumber, organType) {
    return this.sendTemplateMessage(
      phoneNumber,
      'request_completed',
      {
        organType
      }
    );
  }
}

module.exports = new WhatsAppService();
