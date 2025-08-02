import mongoose from "mongoose";

const { Schema } = mongoose;

const BandishSchema = new Schema(
  {
    sId: {
      type: Number,
      required: true,
    },
    bandishName: {
      type: String,
      required: true,
    },
    pdfUrl: {
      type: String,
    },
    audioUrl: {
      type: String,
    },
  },
  { _id: false } // prevent _id for each bandish subdocument
);

const RaagDetailSchema = new Schema(
  {
    raag: {
      type: Schema.Types.ObjectId,
      ref: "Raag",
      required: true,
    },
    sur: {
      type: String,
    },
    thaat: {
      type: String,
    },
    wargitSur: {
      type: String,
    },
    jaati: {
      type: String,
    },
    time: {
      type: String,
    },
    vaadi: {
      type: String,
    },
    samvadi: {
      type: String,
    },
    aroh: {
      type: String,
    },
    avroh: {
      type: String,
    },
    audioUrl: {
      type: String,
    },
    listOfBandish: [BandishSchema],
  },
  {
    timestamps: true,
  }
);

const RaagDetailModel = mongoose.model("RaagDetail", RaagDetailSchema);
export default RaagDetailModel;
