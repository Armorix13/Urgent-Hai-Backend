import User from "../models/user.model.js";
import { forgetpassword, verifyAccount } from "../utils/email.template.js";
import { helper } from "../utils/helper.js";
import { sendMessage } from "../utils/sendMessage.js";

export const getUserById = async (id) => {
  return await User.findById(id);
};

export const getUserByEmail = async (email) => {
  return await User.findOne({ email });
};

export const getUserByuserName = async (userName) => {
  return await User.findOne({ userName });
};
const registerUser = async (req) => {
  try {
    const {
      email,
      password,
      userName,
      phoneNumber,
      countryCode,
      deviceType,
      deviceToken,
      age,
      gender,
      language,
    } = req.body;

    const lowerCaseEmail = email.toLowerCase();
    const existingUser = await getUserByEmail(lowerCaseEmail);

    // CASE 1: User exists and is verified → Block
    if (existingUser && existingUser.isVerified) {
      throw new Error("User already exists with this email.");
    }

    // CASE 2: User exists but not verified → Resend OTP
    if (existingUser && !existingUser.isVerified) {
      const otp = helper.generateOtp(6);
      existingUser.otp = otp;
      existingUser.otpExpiry = helper.addMinutesToCurrentTime(10);
      existingUser.deviceType = deviceType;
      existingUser.deviceToken = deviceToken;
      await existingUser.save();

      await sendMessage.sendEmail({
        userEmail: lowerCaseEmail,
        subject: "Resent OTP for Account Verification",
        text: `Your OTP for account verification is ${otp}`,
        html: verifyAccount(otp),
      });

      return {
        message: "OTP re-sent. Please verify your email.",
        email: lowerCaseEmail,
      };
    }

    // CASE 3: New user → Proceed with registration
    const hashedPassword = await helper.hashPassword(password);

    const newUser = new User({
      email: lowerCaseEmail,
      password: hashedPassword,
      deviceType,
      deviceToken,
      age,
      gender,
      userName,
      language,
      phoneNumber,
      countryCode,
    });

    const otp = helper.generateOtp(6);
    newUser.otp = otp;
    newUser.otpExpiry = helper.addMinutesToCurrentTime(10);
    newUser.isOtpVerified = false;

    await newUser.save();

    await sendMessage.sendEmail({
      userEmail: lowerCaseEmail,
      subject: "Account verification OTP",
      text: `Your OTP for account verification is ${otp}`,
      html: verifyAccount(otp),
    });

    return {
      message:
        "User registered successfully. Please verify the OTP sent to your email.",
      email: lowerCaseEmail,
    };
  } catch (error) {
    console.error("Registration Error:", error);
    throw new Error(error.message || "Internal Server Error");
  }
};

const loginUser = async (req) => {
  try {
    const { email, password, deviceType, deviceToken } = req.body;
    let user;

    if (email) {
      user = await getUserByEmail(email.toLowerCase());
    }

    if (!user) {
      throw new Error("User not found.");
    }

    const isPasswordCorrect = await helper.verifyPassword(
      password,
      user.password
    );

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
    const {
      password: _,
      deviceType: __,
      deviceToken: ___,
      otp: ____,
      otpExpiry: _____,
      jti: ______,
      ...userWithoutSensitiveData
    } = userObject;
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
      throw new Error("User/email not exist.");
    }
    // if (user.otp && user.otpExpiry > Date.now()) {
    //   throw new Error(
    //     "An OTP was already sent. Please wait before requesting a new one."
    //   );
    // }
    const otp = helper.generateOtp(6);
    user.otp = otp;
    user.otpExpiry = helper.addMinutesToCurrentTime(10);
    user.isOtpVerified = false;
    await user.save();
    if (email) {
      await sendMessage.sendEmail({
        userEmail: email,
        subject: "Password Reset Request",
        text: `Your OTP for password reset is ${otp}`,
        html: forgetpassword(otp),
      });
    }
    return;
  } catch (error) {
    throw error;
  }
};

const verifyOtp = async (req) => {
  try {
    const { otp, email, type, deviceType, deviceToken } = req.body;

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

    user.isOtpVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    user.deviceType = deviceType;
    user.deviceToken = deviceToken;

    const jti = helper.generateRandomJti(16);
    user.jti = jti;

    if (Number(type) === 1) {
      user.isVerified = true;
    }

    await user.save();

    const userObject = user.toObject();
    const {
      password,
      deviceType: _dt,
      deviceToken: _dtt,
      otp: _otp,
      otpExpiry: _oe,
      jti: _jti,
      ...userWithoutSensitiveData
    } = userObject;

    // ✅ If type === 1 → send tokens
    if (Number(type) === 1) {
      const payload = {
        _id: userObject._id,
        jti: userObject.jti,
        role: userObject.role,
      };

      const access_token = helper.generateToken(payload, "access");
      const refresh_token = helper.generateToken(payload, "refresh");

      return {
        ...userWithoutSensitiveData,
        access_token,
        refresh_token,
      };
    }

    // ❌ Else → return only user data
    return {
      ...userWithoutSensitiveData,
      message: "OTP verified successfully. No token issued for this type.",
    };
  } catch (error) {
    console.error("OTP verification error:", error);
    throw new Error(error.message || "OTP verification failed.");
  }
};

const setPassowrd = async (req) => {
  try {
    const { password, email } = req.body;
    let user;

    if (email) {
      user = await getUserByEmail(email.toLowerCase());
    }
    if (!user.isOtpVerified) {
      throw new Error("Otp is not verifed");
    }
    const comparePassword = await helper.verifyPassword(
      password,
      user.password
    );
    if (comparePassword) {
      throw new Error("new password is not same as old");
    }
    const hashedPassword = await helper.hashPassword(password);
    (user.password = hashedPassword), await user.save();
    return;
  } catch (error) {
    throw error;
  }
};

const updateUser = async (req) => {
  try {
    const userId = req.userId;
    const {
      userName,
      email,
      timeZone,
      profileImage,
      longitude,
      latitude,
      gender,
      address,
      age,
      language,
    } = req.body;
    const user = await getUserById(userId);
    if (!user) {
      throw new Error("User not found.");
    }
    if (userName) user.userName = userName;
    if (email) {
      const existingUserByEmail = await getUserByEmail(email.toLowerCase());
      if (
        existingUserByEmail &&
        existingUserByEmail._id.toString() !== userId
      ) {
        throw new Error("Email is already in use by another account.");
      }
      user.email = email.toLowerCase();
    }

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
    if (language) user.gender = language;
    if (age) user.age = age;
    if (address) user.address = address;
    if (timeZone) user.timeZone = timeZone;
    await user.save();
    const {
      password: _,
      deviceType: __,
      deviceToken: ___,
      otp: ____,
      otpExpiry: _____,
      jti: ______,
      ...userWithoutSensitiveData
    } = user.toObject();
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
    const {
      password: _,
      deviceType: __,
      deviceToken: ___,
      otp: ____,
      otpExpiry: _____,
      jti: ______,
      ...userWithoutSensitiveData
    } = user.toObject();
    return userWithoutSensitiveData;
  } catch (error) {
    throw error;
  }
};

const changePassword = async (req) => {
  try {
    const userId = req.userId;
    const { oldPassword, newPassword } = req.body;
    const user = await getUserById(userId);

    if (!user) {
      throw new Error("User not found.");
    }

    const isOldPasswordValid = await helper.verifyPassword(
      oldPassword,
      user.password
    );
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
};

const deleteAccount = async (req) => {
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
};

export const userService = {
  registerUser,
  loginUser,
  forgetPassword,
  verifyOtp,
  setPassowrd,
  updateUser,
  getUserDetails,
  changePassword,
  deleteAccount,
};
