import mongoose from "mongoose";

const Schema = mongoose.Schema;

const suggestionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

suggestionSchema.index({ userId: 1 });
suggestionSchema.index({ createdAt: -1 });

const Suggestion = mongoose.model("Suggestion", suggestionSchema);

export default Suggestion;
