import mongoose from "mongoose";

const baaniSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Baani title is required"],
      trim: true,
    },
    pdfUrl: {
      type: String,
      required: [true, "PDF URL is required"],
      trim: true,
    },
    audioUrl: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const gurbaniSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Gurbani title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    baanis: [baaniSchema],
  },
  { timestamps: true }
);

const Gurbani = mongoose.model("Gurbani", gurbaniSchema);

export default Gurbani;
