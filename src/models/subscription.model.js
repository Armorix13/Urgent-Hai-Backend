import mongoose from "mongoose";
import {
  subscriptionStatusType,
  paymentStatusType,
} from "../utils/enum.js";

const Schema = mongoose.Schema;

const subscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    status: {
      type: Number,
      enum: Object.values(subscriptionStatusType),
      default: subscriptionStatusType.PENDING,
    },
    paymentStatus: {
      type: Number,
      enum: Object.values(paymentStatusType),
      default: paymentStatusType.PENDING,
    },
    paymentReference: {
      type: String,
      trim: true,
    },
    startedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ planId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ expiresAt: 1 });

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
