/**
 * Jest setup file for LifeLink Backend
 */
// Mock environment variables for testing
process.env.MONGODB_URI = 'mongodb://localhost/lifelink_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.PORT = '3001';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.EMAIL_FROM = 'test@lifelink.org';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.WHATSAPP_ENABLED = 'false';
process.env.SMS_ENABLED = 'false';

// Mock console methods to keep test output clean
const originalError = console.error;
const originalWarn = console.warn;
console.error = (...args) => {
  // Only output errors in test files, not in dependencies
  if (!args[0] || !args[0].includes('node_modules')) {
    originalError.apply(console, args);
  }
};
console.warn = (...args) => {
  // Only output warnings in test files, not in dependencies
  if (!args[0] || !args[0].includes('node_modules')) {
    originalWarn.apply(console, args);
  }
};