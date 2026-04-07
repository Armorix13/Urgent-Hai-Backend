import mongoose from "mongoose";

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
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Collaborator = mongoose.model("Collaborator", collaboratorSchema);

export default Collaborator;
