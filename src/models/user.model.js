import mongoose from "mongoose";
import { deviceType, roleType } from "../utils/enum.js";
const Schema = mongoose.Schema;

const userSchema = new Schema({
        name: {
            type: String,
        },
        email: {
            type: String,
        },
        password: {
            type: String,
        },
        countryCode: {
            type: String,
        },
        phoneNumber: {
            type: String,
        },
        role: {
            type: Number,
            required: true,
            enum: [roleType.CUSTOMER, roleType.DRIVER],
            default: roleType.CUSTOMER,
        },
        deviceType: {
            type: Number,
            enum: [deviceType.ANDROID, deviceType.IOS]
        },
        deviceToken: {
            type: String
        },
        timeZone: {
            type: String,
        },
        otp: {
            type: Number,
        },
        otpExpiry: {
            type: Number,
        },
        profileImage: {
            type: String,
        },
        isVerified: {
            type: Boolean,
            default: false
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
        gender: {
            type: String,
        },
        address: {
            type: String,
        },
        location: {
            type: {
                type: String,
                enum: ['Point']
            },
            coordinates: {
                type: [Number],
            }
        }
    },
    {
        timestamps: true,
    }
);

userSchema.index({ location: "2dsphere" });


const User = mongoose.model("User", userSchema);

export default User;
