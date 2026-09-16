const mongoose = require("mongoose");
const dns = require("dns");

const configureDns = () => {
  const servers = (process.env.MONGODB_DNS_SERVERS || "8.8.8.8,1.1.1.1")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (servers.length > 0) {
    dns.setServers(servers);
  }
};

const getConnectionUri = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) return uri;

  // Atlas cluster hostnames require SRV discovery. Preserve credentials,
  // database name, and query parameters while correcting only the scheme.
  if (uri.startsWith("mongodb://")) {
    try {
      const parsed = new URL(uri);
      if (parsed.hostname.endsWith(".mongodb.net")) {
        parsed.protocol = "mongodb+srv:";
        return parsed.toString();
      }
    } catch {
      return uri;
    }
  }
  return uri;
};

const connectDB = async () => {
  configureDns();
  await mongoose.connect(getConnectionUri(), {
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
