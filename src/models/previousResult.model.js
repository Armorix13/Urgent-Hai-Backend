import mongoose from "mongoose";

const Schema = mongoose.Schema;

const previousResultSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

previousResultSchema.index({ createdAt: -1 });

const PreviousResult = mongoose.model(
  "PreviousResult",
  previousResultSchema
);

export default PreviousResult;
