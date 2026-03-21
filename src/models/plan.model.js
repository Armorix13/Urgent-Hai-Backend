import mongoose from "mongoose";
import { currencyType } from "../utils/enum.js";

const Schema = mongoose.Schema;

const planSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    durationMonths: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: Object.values(currencyType),
      default: currencyType.INR,
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

planSchema.index({ isActive: 1 });
planSchema.index({ durationMonths: 1 });

const Plan = mongoose.model("Plan", planSchema);

export default Plan;
