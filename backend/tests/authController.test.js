const authController = require('../src/controllers/authController');
const Hospital = require('../src/models/Hospital');
const Admin = require('../src/models/Admin');
const crypto = require('crypto');
const jwt = require('../src/utils/jwt');
const passwordUtils = require('../src/utils/password');
const emailService = require('../src/services/emailService');
const notificationService = require('../src/services/notificationService');
const authValidator = require('../src/validators/authValidator');

// Mock dependencies
jest.mock('../src/models/Hospital');
jest.mock('../src/models/Admin');
jest.mock('crypto');
jest.mock('../src/utils/password');
jest.mock('../src/utils/jwt');
jest.mock('../src/services/emailService');
jest.mock('../src/services/notificationService');
jest.mock('../src/validators/authValidator', () => ({
  validateEmail: jest.fn(),
  validateHospitalRegistration: jest.fn(),
  validateLogin: jest.fn(),
}));

describe('AuthController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    // Set default mock implementations: validation passes
    authValidator.validateEmail.mockReturnValue(true); // valid email
    authValidator.validateHospitalRegistration.mockReturnValue(null); // no error
    authValidator.validateLogin.mockReturnValue(null); // no error
  });

  describe('registerHospital', () => {
    it('should return 409 if hospital email already exists', async () => {
      // Arrange
      const hospitalData = {
        hospitalName: 'Test Hospital',
        email: 'test@hospital.org',
        password: 'password123',
        phone: '+1234567890',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        pincode: '12345'
      };
      req.body = hospitalData;
      Hospital.findOne.mockResolvedValue({ _id: 1 }); // Simulate existing hospital

      // Act
      await authController.registerHospital(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Hospital email already registered'
      });
    });

    it('should hash password and create hospital', async () => {
      // Arrange
      const hospitalData = {
        hospitalName: 'Test Hospital',
        email: 'test@hospital.org',
        password: 'password123',
        phone: '+1234567890',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        pincode: '12345'
      };
      req.body = hospitalData;
      Hospital.findOne.mockResolvedValue(null); // No existing hospital
      passwordUtils.hashPassword.mockResolvedValue('hashedPassword');
      const savedHospital = {
        _id: 'hospitalId',
        hospitalName: 'Test Hospital',
        email: 'test@hospital.org',
        phone: '+1234567890',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        pincode: '12345',
        createdAt: new Date(),
        isVerified: false,
        status: 'Pending',
        role: 'hospital',
        save: jest.fn().mockResolvedValue(true)
      };
      Hospital.create.mockResolvedValue(savedHospital);
      emailService.sendHospitalRegistrationEmail.mockResolvedValue();
      notificationService.sendHospitalNotification.mockResolvedValue();

      // Act
      await authController.registerHospital(req, res);

      // Assert
      expect(Hospital.create).toHaveBeenCalledWith({
        hospitalName: 'Test Hospital',
        email: 'test@hospital.org',
        password: 'hashedPassword',
        phone: '+1234567890',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        pincode: '12345',
        latitude: undefined,
        longitude: undefined,
        isVerified: false,
        status: 'Pending',
        role: 'hospital'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Hospital registered successfully')
        })
      );
    });
  });

  describe('loginHospital', () => {
    it('should return 401 for invalid credentials', async () => {
      // Arrange
      req.body = { email: 'test@hospital.org', password: 'wrongpassword' };
      Hospital.findOne.mockResolvedValue(null); // Hospital not found

      // Act
      await authController.loginHospital(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password'
      });
    });

    it('should return 403 for unverified hospital', async () => {
      // Arrange
      req.body = { email: 'test@hospital.org', password: 'password123' };
      const hospital = {
        _id: 'hospitalId',
        email: 'test@hospital.org',
        password: 'hashedPassword',
        isVerified: false,
        status: 'Pending',
        role: 'hospital'
      };
      Hospital.findOne.mockResolvedValue(hospital);
      passwordUtils.comparePassword.mockResolvedValue(true);

      // Act
      await authController.loginHospital(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Hospital is not verified by administrator yet',
        status: 'Pending'
      });
    });

    it('should generate token for verified hospital', async () => {
      // Arrange
      req.body = { email: 'test@hospital.org', password: 'password123' };
      const hospital = {
        _id: 'hospitalId',
        email: 'test@hospital.org',
        password: 'hashedPassword',
        isVerified: true,
        status: 'Active',
        role: 'hospital'
      };
      Hospital.findOne.mockResolvedValue(hospital);
      passwordUtils.comparePassword.mockResolvedValue(true);
      jwt.generateToken.mockReturnValue('fakeToken');

      // Act
      await authController.loginHospital(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Hospital login successful',
          token: 'fakeToken',
          user: expect.objectContaining({
            id: 'hospitalId',
            email: 'test@hospital.org',
            role: 'hospital'
          })
        })
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('should return 400 for invalid email', async () => {
      // Arrange
      req.body = { email: 'invalidemail' };
      // Override the default mock for this test: invalid email returns false
      authValidator.validateEmail.mockReturnValue(false);

      // Act
      await authController.requestPasswordReset(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'A valid email and account type are required'
      });
    });

    it('should generate reset token and send email', async () => {
      // Arrange
      req.body = { email: 'test@hospital.org', role: 'hospital' };
      const hospital = {
        email: 'test@hospital.org',
        save: jest.fn().mockResolvedValue(true)
      };
      Hospital.findOne.mockResolvedValue(hospital);

      // Mock crypto
      const mockRandomBytesResult = {
        toString: (format) => {
          expect(format).toBe('hex');
          return 'resetToken';
        }
      };
      crypto.randomBytes.mockReturnValue(mockRandomBytesResult);
      const mockHashResult = {
        update: (input) => {
          expect(input).toBe('resetToken');
          return {
            digest: (format) => {
              expect(format).toBe('hex');
              return 'hashedToken';
            }
          };
        }
      };
      crypto.createHash.mockReturnValue(mockHashResult);

      emailService.sendPasswordResetEmail.mockResolvedValue();

      // Act
      await authController.requestPasswordReset(req, res);

      // Assert
      expect(hospital.resetPasswordToken).toBe('hashedToken');
      expect(hospital.resetPasswordExpires).toBeGreaterThan(Date.now());
      expect(hospital.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'If an account exists for this email, a password reset link has been sent.'
      });
    });
  });

  describe('resetPassword', () => {
    it('should return 400 for invalid token', async () => {
      // Arrange
      req.params = { token: 'invalidtoken' };
      req.body = { password: 'newpassword', role: 'hospital' };
      // Mock crypto for hashing the token
      const mockHashObject = {
        update: (input) => {
          expect(input).toBe('invalidtoken');
          return {
            digest: (alg) => {
              expect(alg).toBe('hex');
              return 'hashedtoken';
            }
          };
        }
      };
      crypto.createHash.mockReturnValue(mockHashObject);
      Hospital.findOne.mockResolvedValue(null); // No user with token

      // Act
      await authController.resetPassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Reset token is invalid or expired'
      });
    });

    it('should update password and clear token', async () => {
      // Arrange
      req.params = { token: 'validtoken' };
      req.body = { password: 'newpassword', role: 'hospital' };
      const hospital = {
        save: jest.fn().mockResolvedValue(true)
      };
      // Mock crypto for hashing the token
      const mockHashObject = {
        update: (input) => {
          expect(input).toBe('validtoken');
          return {
            digest: (alg) => {
              expect(alg).toBe('hex');
              return 'hashedtoken';
            }
          };
        }
      };
      crypto.createHash.mockReturnValue(mockHashObject);
      Hospital.findOne.mockResolvedValue(hospital);
      passwordUtils.hashPassword.mockResolvedValue('hashedPassword');

      // Act
      await authController.resetPassword(req, res);

      // Assert
      expect(hospital.password).toBe('hashedPassword');
      expect(hospital.resetPasswordToken).toBeNull();
      expect(hospital.resetPasswordExpires).toBeNull();
      expect(hospital.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password reset successfully'
      });
    });
  });
});