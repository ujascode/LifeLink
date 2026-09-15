const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  console.log("MongoDB connected successfully");
};

const connectWithRetry = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await connectDB();
      return;
    } catch (error) {
      retries += 1;
      console.log(`MongoDB connection attempt ${retries} failed: ${error.message}`);
      if (retries === maxRetries) {
        console.error("MongoDB connection failed after all retries");
        throw error;
      }
      // Wait for 2^retries seconds before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** retries));
    }
  }
};

module.exports = { connectDB, connectWithRetry };
