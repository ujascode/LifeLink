const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateHospitalRegistration = (data) => {
  const { hospitalName, email, password, phone, address, city } = data;

  if (!hospitalName || !email || !password || !phone || !address || !city) {
    return "All required fields must be provided";
  }

  if (!validateEmail(email)) {
    return "Invalid email address";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }

  return null;
};

const validateLogin = (data) => {
  const { email, password } = data;

  if (!email || !password) {
    return "Email and password are required";
  }

  if (!validateEmail(email)) {
    return "Invalid email address";
  }

  return null;
};

module.exports = {
  validateHospitalRegistration,
  validateLogin,
};
