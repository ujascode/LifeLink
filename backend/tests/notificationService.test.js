const notificationService = require('../src/services/notificationService');

describe('NotificationService - Content Generation', () => {
  describe('generateEmailContent', () => {
    it('should generate content for HospitalVerified event', () => {
      // Act
      const result = notificationService.generateEmailContent(
        'HospitalVerified',
        { message: 'Your hospital is verified' },
        'test@hospital.org'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.subject).toContain('Hospital Verified');
      expect(result.to).toBe('test@hospital.org');
    });

    it('should generate content for HospitalRegistration event', () => {
      // Act
      const result = notificationService.generateEmailContent(
        'HospitalRegistration',
        {
          hospitalName: 'Test Hospital',
          email: 'test@hospital.org',
          phone: '+1234567890',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          pincode: '12345',
          createdAt: new Date()
        },
        'admin@lifelink.org'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.subject).toContain('New Hospital Registration');
      expect(result.to).toBe('admin@lifelink.org');
    });

    it('should return null for unknown event', () => {
      // Act
      const result = notificationService.generateEmailContent(
        'UnknownEvent',
        {},
        'test@test.com'
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('generateWhatsAppContent', () => {
    it('should generate content for NewRequest event', () => {
      // Act
      const result = notificationService.generateWhatsAppContent(
        'NewRequest',
        { requestingHospitalName: 'Test Hospital', organType: 'Kidney' }
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.templateName).toBe('new_organ_request');
      expect(result.templateParams.requestingHospitalName).toBe('Test Hospital');
    });

    it('should generate content for HospitalRegistration event', () => {
      // Act
      const result = notificationService.generateWhatsAppContent(
        'HospitalRegistration',
        {}
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.templateName).toBe('hospital_registration');
    });

    it('should return null for unknown event', () => {
      // Act
      const result = notificationService.generateWhatsAppContent(
        'UnknownEvent',
        {}
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('generateSMSContent', () => {
    it('should generate content for NewRequest event', () => {
      // Act
      const result = notificationService.generateSMSContent(
        'NewRequest',
        { requestingHospitalName: 'Test Hospital', organType: 'Kidney' }
      );

      // Assert
      expect(result).toBeDefined();
      expect(result).toContain('Test Hospital');
      expect(result).toContain('Kidney');
    });

    it('should generate content for RequestApproved event', () => {
      // Act
      const result = notificationService.generateSMSContent(
        'RequestApproved',
        { supplyingHospitalName: 'Supplying Hospital', organType: 'Liver' }
      );

      // Assert
      expect(result).toBeDefined();
      expect(result).toContain('Supplying Hospital');
      expect(result).toContain('Liver');
    });

    it('should return null for unknown event', () => {
      // Act
      const result = notificationService.generateSMSContent(
        'UnknownEvent',
        {}
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('eventToTitle', () => {
    it('should convert event types to human-readable titles', () => {
      expect(notificationService.eventToTitle('NewRequest')).toBe('New Organ Request');
      expect(notificationService.eventToTitle('RequestApproved')).toBe('Organ Request Accepted');
      expect(notificationService.eventToTitle('RequestRejected')).toBe('Organ Request Rejected');
      expect(notificationService.eventToTitle('RequestUpdated')).toBe('Organ Request Updated');
      expect(notificationService.eventToTitle('HospitalVerified')).toBe('Hospital Verified');
      expect(notificationService.eventToTitle('UnknownEvent')).toBe('UnknownEvent');
    });
  });
});