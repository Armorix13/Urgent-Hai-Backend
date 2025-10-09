import mongoose from "mongoose";
import { professionType } from "../utils/enum.js";

const Schema = mongoose.Schema;

const collaboratorSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    profile: {
      type: String,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    profession: {
      type: Number,
      enum: [professionType.RAAGI, professionType.DHADHI, professionType.KATHA_VACHAK],
    },
  },
  {
    timestamps: true,
  }
);

const Collaborator = mongoose.model("Collaborator", collaboratorSchema);

export default Collaborator;
