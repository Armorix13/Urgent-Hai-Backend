import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Error: MONGO_URI not found in environment variables.");
  process.exit(1);
}

const collaboratorSchema = new mongoose.Schema(
  {
    isRaagManagement: {
      type: Boolean,
      default: true,
    },
  },
  { strict: false }
);

const Collaborator = mongoose.model("Collaborator", collaboratorSchema);

async function seed() {
  try {
    console.log("Connecting to MongoDB at:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully! Seeding existing Collaborators...");

    const res = await Collaborator.updateMany(
      {},
      { $set: { isRaagManagement: true } }
    );

    console.log("Seeding complete! Result:", res);
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seed();
