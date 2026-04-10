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
    coverProfile: {
      type: String,
      default: null,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    profession: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

collaboratorSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
});
collaboratorSchema.set("toObject", {
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
});


const Collaborator = mongoose.model("Collaborator", collaboratorSchema);

export default Collaborator;
