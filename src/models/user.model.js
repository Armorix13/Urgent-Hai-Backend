import mongoose from "mongoose";
import { deviceType, genderType, roleType } from "../utils/enum.js";
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    userName: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    role: {
      type: Number,
      enum: [roleType.ADMIN, roleType.USER],
      default: roleType.USER,
    },
    deviceType: {
      type: Number,
      enum: [deviceType.ANDROID, deviceType.IOS],
    },
    deviceToken: {
      type: String,
    },
    timeZone: {
      type: String,
    },
    age: {
      type: Number,
    },
    gender: {
      type: Number,
      enum: [genderType.FEMALE, genderType.MALE, genderType.OTHER],
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Number,
    },
    isOtpVerified: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    socialId: {
      type: String,
    },
    jti: {
      type: String,
    },
    longitude: {
      type: Number,
    },
    latitude: {
      type: Number,
    },
    address: {
      type: String,
    },
    language: {
      type: String,
      enum: [
        "Punjabi",
        "Urdu",
        "Faarsi",
        "Hindi",
        "English",
        "Spanish",
        "French",
      ],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ location: "2dsphere" });

const User = mongoose.model("User", userSchema);

export default User;
