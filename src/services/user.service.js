import User from "../models/user.model.js";
import { forgetpassword } from "../utils/email.template.js";
import { helper } from "../utils/helper.js";
import { sendMessage } from "../utils/sendMessage.js";

export const getUserById = async (id) => {
    return await User.findById(id);
};

export const getUserByEmail = async (email) => {
    return await User.findOne({ email });
};

export const getUserByPhone = async (phoneNumber) => {
    return await User.findOne({ phoneNumber });
};

const registerUser = async (req) => {
    try {
        const { email, password, name, phoneNumber, countryCode, deviceType, deviceToken, role } = req.body;

        const existingUserByEmail = await getUserByEmail(email.toLowerCase());
        const existingUserByPhone = await getUserByPhone(phoneNumber);

        if (existingUserByEmail) {
            throw new Error("User already exists with this email.");
        }
        if (existingUserByPhone) {
            throw new Error("User already exists with this phone number.");
        }

        const hashedPassword = await helper.hashPassword(password);

        const newUser = new User({
            email: email.toLowerCase(),
            password: hashedPassword,
            name,
            phoneNumber,
            countryCode,
            role: role,
            deviceType,
            deviceToken,
        });

        const jti = helper.generateRandomJti(16);
        newUser.jti = jti;

        await newUser.save();

        const userObject = newUser.toObject();

        const payload = {
            _id: userObject._id,
            jti: userObject.jti,
            role: userObject.role,
        };

        const access_token = helper.generateToken(payload, "access");
        const refresh_token = helper.generateToken(payload, "refresh");

        const { password: _, deviceType: __, deviceToken: ___,otp: ____, otpExpiry: _____,jti:______,...userWithoutSensitiveData } = userObject;

        return { ...userWithoutSensitiveData, access_token, refresh_token };
    } catch (error) {
        throw error;
    }
};


const loginUser = async (req) => {
    try {
        const { email, password, phoneNumber, countryCode, deviceType, deviceToken } = req.body;
        let user;
        if (email) {
            user = await getUserByEmail(email.toLowerCase());
        } else if (phoneNumber) {
            user = await getUserByPhone(phoneNumber);
        }

        if (!user) {
            throw new Error("User not found.");
        }

        const isPasswordCorrect = await helper.verifyPassword(password, user.password);

        if (!isPasswordCorrect) {
            throw new Error("Invalid credentials.");
        }

        const jti = helper.generateRandomJti(16);
        user.jti = jti;
        user.deviceType = deviceType;
        user.deviceToken = deviceToken;

        await user.save();

        const userObject = user.toObject();

        const payload = {
            _id: userObject._id,
            jti: userObject.jti,
            role: userObject.role,
        };

        const access_token = helper.generateToken(payload, "access");
        const refresh_token = helper.generateToken(payload, "refresh");
        const { password: _, deviceType: __, deviceToken: ___,otp: ____, otpExpiry: _____,jti:______,...userWithoutSensitiveData } = userObject;
        return { ...userWithoutSensitiveData, access_token, refresh_token };
    } catch (error) {
        throw error;
    }
};

const forgetPassword = async (req) => {
    try {
        const { email } = req.body;
        const user = await getUserByEmail(email.toLowerCase());
        if (!user) {
            throw new Error("User not found.");
        }
        if (user.otp && user.otpExpiry > Date.now()) {
            throw new Error("An OTP was already sent. Please wait before requesting a new one.");
        }
        const otp = helper.generateOtp(6);
        user.otp = otp;
        user.otpExpiry = helper.addMinutesToCurrentTime(10);
        user.isVerified = false;
        await user.save();
        if (email) {
            await sendMessage.sendEmail({
                userEmail: email,
                subject: "Password Reset Request",
                text: `Your OTP for password reset is ${otp}`,
                html: forgetpassword(otp)
            });
        }
        return;
    } catch (error) {
        throw error;
    }
};

const verifyOtp = async (req) => {
    try {
        const { otp, email } = req.body;
        const user = await getUserByEmail(email.toLowerCase());
        if (!user) {
            throw new Error("User not found.");
        }

        if (user.otp !== otp) {
            throw new Error("Invalid OTP. Please try again.");
        }

        if (user.otpExpiry < Date.now()) {
            throw new Error("OTP has expired. Please request a new one.");
        }
        user.isVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();
        return;
    } catch (error) {
        throw error;
    }
}

const updateUser = async (req) => {
    try {
        const userId = req.userId;
        const { name, email, countryCode, phoneNumber, timeZone, profileImage, longitude, latitude, gender, address } = req.body;
        const user = await getUserById(userId);
        if (!user) {
            throw new Error("User not found.");
        }
        if (name) user.name = name;
        if (email) {
            const existingUserByEmail = await getUserByEmail(email.toLowerCase());
            if (existingUserByEmail && existingUserByEmail._id.toString() !== userId) {
                throw new Error("Email is already in use by another account.");
            }
            user.email = email.toLowerCase();
        }

        if (phoneNumber) {
            const existingUserByPhone = await getUserByPhone(phoneNumber);
            if (existingUserByPhone && existingUserByPhone._id.toString() !== userId) {
                throw new Error("Phone number is already in use by another account.");
            }
            user.phoneNumber = phoneNumber;
        }
        if (countryCode) user.countryCode = countryCode;
        if (latitude && longitude) {
            user.latitude = latitude;
            user.longitude = longitude;
            user.location = {
                type: "Point",
                coordinates: [longitude, latitude],
            };
        }
        if (profileImage) user.profileImage = profileImage;
        if (gender) user.gender = gender;
        if (address) user.address = address;
        if (timeZone) user.timeZone = timeZone;
        await user.save();
        const { password: _, deviceType: __, deviceToken: ___,otp: ____, otpExpiry: _____,jti:______,...userWithoutSensitiveData } = user.toObject();
        return userWithoutSensitiveData;
    } catch (error) {
        throw error;
    }
};

const getUserDetails = async (req) => {
    try {
        const userId = req.userId;
        const user = await getUserById(userId);
        if (!user) {
            throw new Error("User not found.");
        }
        const { password: _, deviceType: __, deviceToken: ___,otp: ____, otpExpiry: _____,jti:______,...userWithoutSensitiveData } = user.toObject();
        return userWithoutSensitiveData;
    } catch (error) {
        throw error;
    }
}

const changePassword = async (req) => {
    try {
        const userId = req.userId;
        const { oldPassword, newPassword } = req.body;
        const user = await getUserById(userId);

        if (!user) {
            throw new Error("User not found.");
        }

        const isOldPasswordValid = await helper.verifyPassword(oldPassword, user.password);
        if (!isOldPasswordValid) {
            throw new Error("Old password is incorrect.");
        }

        if (oldPassword === newPassword) {
            throw new Error("New password cannot be the same as the old password.");
        }

        if (newPassword.length < 8) {
            throw new Error("New password must be at least 8 characters long.");
        }

        const hashedPassword = await helper.hashPassword(newPassword);

        user.password = hashedPassword;
        await user.save();
        return;
    } catch (error) {
        throw error;
    }
}

const deleteAccount = async(req)=>{
    try {
      const userId = req.userId;
      const user = await getUserById(userId);
      if (!user) {
          throw new Error("User not found.");
      }  
      //delete all user releted data
      //then delete user
      await User.findByIdAndDelete(user._id);
      return; 
    } catch (error) {
      throw error;  
    }
}


export const userService = { registerUser, loginUser, forgetPassword, verifyOtp, updateUser, getUserDetails, changePassword,deleteAccount };
