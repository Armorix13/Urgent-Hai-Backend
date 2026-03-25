import mongoose from "mongoose";
import { MONGO_URI } from "./index.js";

const mongooseOptions = {
  serverSelectionTimeoutMS: 20000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  // Prefer IPv4 — some cloud hosts (Render, etc.) have flaky IPv6 to Atlas
  family: 4,
};

const connectDB = async () => {
  try {
    if (!MONGO_URI) {
      console.error("MongoDB connection error: MONGO_URI is not set");
      process.exit(1);
    }
    await mongoose.connect(MONGO_URI, mongooseOptions);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
