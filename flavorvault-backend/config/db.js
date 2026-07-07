const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.warn("MONGO_URI is not set. Backend will start without database connectivity.");
      return null;
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB Error:", error.message);
    return null;
  }
};

module.exports = connectDB;