import mongoose from "mongoose";
import dotenv from "dotenv";
import Collaborator from "./src/models/collaborator.model.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const colls = await Collaborator.find();
    console.log("Found", colls.length, "collaborators:");
    colls.forEach(c => {
      console.log("- Name:", c.name);
      console.log("  isRaagManagement directly:", c.isRaagManagement);
      console.log("  toObject():", c.toObject());
    });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
