import mongoose from "mongoose";

const { Schema } = mongoose;

const RaagSchema = new Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const RaagModel = mongoose.model("Raag", RaagSchema);
export default RaagModel;
