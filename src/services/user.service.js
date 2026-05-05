import User from "../models/user.model.js";
import Subscription from "../models/subscription.model.js";
import Enrollment from "../models/enrollment.model.js";
import Suggestion from "../models/suggestion.model.js";
import WalletTransaction from "../models/walletTransaction.model.js";
import {
  PUBLIC_USER_SELECT,
  enrichPublicUser,
} from "../utils/userPublic.util.js";
import { forgetpassword, verifyAccount } from "../utils/email.template.js";
import { helper } from "../utils/helper.js";
import { sendMessage } from "../utils/sendMessage.js";
import { subscriptionStatusType } from "../utils/enum.js";
import {
  normalizeDeviceType,
  normalizeLanguage,
} from "../utils/userNormalize.js";

const GENDER_MAP = {
  male: 1,
  female: 2,
  other: 3,
  Male: 1,
  Female: 2,
  Other: 3,
};

const normalizeGender = (value) => {
  if (value == null) return undefined;
  if (typeof value === "number" && [1, 2, 3].includes(value)) return value;
  if (typeof value === "string") return GENDER_MAP[value];
  return undefined;
};

/**
 * For API responses (password never sent). `userHasBeenSocialLogin` is true if they ever used social auth
 * or have `hasUsedSocialLogin` / `provider` set.
 * @param {import("mongoose").Document | Record<string, unknown>|null|undefined} user
 */
const getUserAuthProfileFlags = (user) => {
  if (!user) {
    return { hasPassword: false, userHasBeenSocialLogin: false };
  }
  const pwd = user.password;
  const hasPassword = pwd != null && String(pwd).length > 0;
  const userHasBeenSocialLogin = Boolean(
    user.hasUsedSocialLogin === true || user.provider
  );
  return { hasPassword, userHasBeenSocialLogin };
};

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

    const normalizedDeviceType = normalizeDeviceType(deviceType);
    const normalizedLanguage = normalizeLanguage(language);
    if (!normalizedLanguage) {
      throw new Error(
        "Invalid language. Use English, Hindi, Punjabi, etc., or codes: en, hi, pa, ur, fa, fr, es."
      );
    }

    // CASE 1: User exists and is verified → Block
    if (existingUser && existingUser.isVerified) {
      throw new Error("User already exists with this email.");
    }

    // CASE 2: User exists but not verified → Resend OTP
    if (existingUser && !existingUser.isVerified) {
      const otp = helper.generateOtp(6);
      existingUser.otp = otp;
      existingUser.otpExpiry = helper.addMinutesToCurrentTime(10);
      if (normalizedDeviceType != null) existingUser.deviceType = normalizedDeviceType;
      if (deviceToken) existingUser.deviceToken = String(deviceToken);
      if (phoneNumber !== undefined) existingUser.phoneNumber = phoneNumber;
      if (countryCode !== undefined) existingUser.countryCode = countryCode;
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

    const normalizedGender =
      gender !== undefined && gender !== null
        ? normalizeGender(gender)
        : undefined;

    const newUser = new User({
      email: lowerCaseEmail,
      password: hashedPassword,
      ...(normalizedDeviceType != null ? { deviceType: normalizedDeviceType } : {}),
      ...(deviceToken ? { deviceToken: String(deviceToken) } : {}),
      age,
      ...(normalizedGender != null ? { gender: normalizedGender } : {}),
      userName,
      language: normalizedLanguage,
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

const socialLogin = async (req) => {
  try {
    const {
      email,
      provider,
      providerId,
      userName,
      firstName,
      lastName,
      profileImage,
      phoneNumber,
      countryCode,
      deviceType,
      deviceToken,
    } = req.body;

    const lowerCaseEmail = email.toLowerCase();
    const normalizedDeviceType = normalizeDeviceType(deviceType);

    let user = await User.findOne({
      email: lowerCaseEmail,
      role: { $in: [1, 2] },
    });

    if (user) {
      if (user.provider && user.providerId) {
        if (user.provider !== provider || user.providerId !== providerId) {
          user.provider = provider;
          user.providerId = providerId;
        }
      } else {
        user.provider = provider;
        user.providerId = providerId;
      }

      const displayName =
        userName || [firstName, lastName].filter(Boolean).join(" ").trim();
      if (profileImage) user.profileImage = profileImage;
      if (displayName) user.userName = displayName;
      if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
      if (countryCode !== undefined) user.countryCode = countryCode;

      if (normalizedDeviceType != null) user.deviceType = normalizedDeviceType;
      if (deviceToken) user.deviceToken = String(deviceToken);
      user.isVerified = true;
      user.socialId = providerId;
      user.hasUsedSocialLogin = true;
      await user.save();
    } else {
      const displayName =
        userName || [firstName, lastName].filter(Boolean).join(" ").trim() || "User";
      user = await User.create({
        email: lowerCaseEmail,
        provider,
        providerId,
        socialId: providerId,
        userName: displayName,
        profileImage: profileImage || undefined,
        phoneNumber: phoneNumber || undefined,
        countryCode: countryCode || undefined,
        ...(normalizedDeviceType != null ? { deviceType: normalizedDeviceType } : {}),
        ...(deviceToken ? { deviceToken: String(deviceToken) } : {}),
        isVerified: true,
        hasUsedSocialLogin: true,
      });
    }

    const jti = helper.generateRandomJti(16);
    user.jti = jti;
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
    const authFlags = getUserAuthProfileFlags(user);
    return {
      ...userWithoutSensitiveData,
      ...authFlags,
      access_token,
      refresh_token,
    };
  } catch (error) {
    throw error;
  }
};

const loginUser = async (req) => {
  try {
    const { email, phoneNumber, password, deviceType, deviceToken } = req.body;
    let user;

    if (email) {
      user = await getUserByEmail(email.toLowerCase());
    } else if (phoneNumber) {
      user = await User.findOne({ phoneNumber: String(phoneNumber).trim() });
    }

    if (!user) {
      throw new Error("User not found.");
    }

    if (!user.isVerified) {
      throw new Error("Account is not verified. Please verify your account first.");
    }

    const isPasswordCorrect = await helper.verifyPassword(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      throw new Error("Invalid credentials.");
    }

    const normalizedDeviceType = normalizeDeviceType(deviceType);
    const jti = helper.generateRandomJti(16);

    const deviceUpdate = { jti };
    if (normalizedDeviceType != null) deviceUpdate.deviceType = normalizedDeviceType;
    if (deviceToken) deviceUpdate.deviceToken = String(deviceToken);

    await User.findByIdAndUpdate(user._id, { $set: deviceUpdate });

    const userObject = (
      await User.findById(user._id).lean()
    );

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
    const authFlags = getUserAuthProfileFlags(userObject);
    return {
      ...userWithoutSensitiveData,
      ...authFlags,
      access_token,
      refresh_token,
    };
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
    const otpExpiry = helper.addMinutesToCurrentTime(10);
    await User.findByIdAndUpdate(user._id, {
      $set: {
        otp,
        otpExpiry,
        isOtpVerified: false,
      },
    });

    const emailLower = email.toLowerCase();
    await sendMessage.sendEmail({
      userEmail: emailLower,
      subject: "Password Reset Request",
      text: `Your OTP for password reset is ${otp}`,
      html: forgetpassword(otp),
    });
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

    if (String(user.otp) !== String(otp)) {
      throw new Error("Invalid OTP. Please try again.");
    }

    if (user.otpExpiry < Date.now()) {
      throw new Error("OTP has expired. Please request a new one.");
    }

    const normalizedDeviceType = normalizeDeviceType(deviceType);
    const jti = helper.generateRandomJti(16);

    const $set = {
      isOtpVerified: true,
      otp: null,
      otpExpiry: null,
      jti,
    };

    if (normalizedDeviceType != null) {
      $set.deviceType = normalizedDeviceType;
    }
    if (deviceToken != null && deviceToken !== "") {
      $set.deviceToken = deviceToken;
    }

    if (Number(type) === 1) {
      $set.isVerified = true;
    }

    await User.findByIdAndUpdate(user._id, { $set });

    const userObject = await User.findById(user._id).lean();
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
      const authFlags = getUserAuthProfileFlags(userObject);

      return {
        ...userWithoutSensitiveData,
        ...authFlags,
        access_token,
        refresh_token,
      };
    }

    // ❌ Else → return only user data
    const authFlagsNoToken = getUserAuthProfileFlags(userObject);
    return {
      ...userWithoutSensitiveData,
      ...authFlagsNoToken,
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
      throw new Error("OTP is not verified. Complete OTP verification first.");
    }
    const comparePassword = await helper.verifyPassword(
      password,
      user.password
    );
    if (comparePassword) {
      throw new Error("new password is not same as old");
    }
    const hashedPassword = await helper.hashPassword(password);
    await User.findByIdAndUpdate(user._id, {
      $set: { password: hashedPassword },
    });
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
      fullName,
      email,
      timeZone,
      profileImage,
      longitude,
      latitude,
      gender,
      address,
      age,
      language,
      phoneNumber,
      countryCode,
    } = req.body;
    const user = await getUserById(userId);
    if (!user) {
      throw new Error("User not found.");
    }
    // Support both userName and fullName (Edit Profile UI label)
    const nameToSet = userName || fullName;
    if (nameToSet) user.userName = nameToSet;
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

    if (latitude != null && longitude != null) {
      user.latitude = latitude;
      user.longitude = longitude;
      user.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }
    if (profileImage !== undefined) user.profileImage = profileImage;
    const normalizedGender = normalizeGender(gender);
    if (normalizedGender) user.gender = normalizedGender;
    if (language) {
      const lang = normalizeLanguage(language);
      if (!lang) {
        throw new Error(
          "Invalid language. Use English, Hindi, Punjabi, etc., or codes: en, hi, pa, ur, fa, fr, es."
        );
      }
      user.language = lang;
    }
    if (age != null) user.age = age;
    if (address !== undefined) user.address = address;
    if (timeZone !== undefined) user.timeZone = timeZone;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (countryCode !== undefined) user.countryCode = countryCode;
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
    const authFlags = getUserAuthProfileFlags(user);
    return { ...userWithoutSensitiveData, ...authFlags };
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

    const activeSubscription = await Subscription.findOne({
      userId,
      status: subscriptionStatusType.ACTIVE,
      expiresAt: { $gt: new Date() },
    })
      .populate("planId", "title price currency durationMonths discountPercentage")
      .sort({ expiresAt: -1 })
      .lean();

    const currentPlan = activeSubscription?.planId || null;
    const subscription = activeSubscription
      ? {
          id: activeSubscription._id,
          status: activeSubscription.status,
          paymentStatus: activeSubscription.paymentStatus,
          startedAt: activeSubscription.startedAt,
          expiresAt: activeSubscription.expiresAt,
          plan: currentPlan,
        }
      : null;

    const rawWallet = userWithoutSensitiveData.wallet;
    const wallet =
      rawWallet == null || rawWallet === ""
        ? 0
        : Number.isFinite(Number(rawWallet))
          ? Math.max(0, Number(rawWallet))
          : 0;

    const authFlags = getUserAuthProfileFlags(user);

    return {
      ...userWithoutSensitiveData,
      wallet,
      subscription,
      currentPlan,
      isPremium: !!activeSubscription,
      ...authFlags,
    };
  } catch (error) {
    throw error;
  }
};

const setInitialPassword = async (req) => {
  try {
    const userId = req.userId;
    const { newPassword } = req.body;
    const user = await getUserById(userId);

    if (!user) {
      throw new Error("User not found.");
    }

    if (user.password) {
      throw new Error(
        "A password is already set. Use change password to update it."
      );
    }

    const hashedPassword = await helper.hashPassword(newPassword);
    await User.findByIdAndUpdate(user._id, {
      $set: { password: hashedPassword },
    });
    return;
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

    if (!user.password) {
      throw new Error(
        "No password on file. Use POST /user/set-password while signed in to create one."
      );
    }

    const isOldPasswordValid = await helper.verifyPassword(
      oldPassword,
      user.password
    );
    if (!isOldPasswordValid) {
      throw new Error("Old password is incorrect.");
    }

    const hashedPassword = await helper.hashPassword(newPassword);
    await User.findByIdAndUpdate(user._id, {
      $set: { password: hashedPassword },
    });
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

/** Clears session + push targets so existing JWTs are rejected (jti mismatch) and device no longer receives notifications. */
const logoutUser = async (req) => {
  try {
    const userId = req.userId;
    const user = await getUserById(userId);
    if (!user) {
      throw new Error("User not found.");
    }
    await User.findByIdAndUpdate(userId, {
      $set: { jti: null, deviceToken: null },
      $unset: { deviceType: "" },
    });
    return;
  } catch (error) {
    throw error;
  }
};

const getAllUsers = async (req) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({})
        .select(PUBLIC_USER_SELECT)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({}),
    ]);

    const list = users.map((u) => enrichPublicUser(u));
    return {
      users: list,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (error) {
    throw error;
  }
};

const getWallet = async (req) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("wallet").lean();
    if (!user) {
      throw new Error("User not found.");
    }
    return { wallet: user.wallet ?? 0 };
  } catch (error) {
    throw error;
  }
};

const getUserProfileById = async (req) => {
  try {
    const { id } = req.params;
    const viewerId = req.userId;

    const userLean = await User.findById(id)
      .select(`${PUBLIC_USER_SELECT} wallet`)
      .lean();
    if (!userLean) {
      throw new Error("User not found.");
    }

    const user = enrichPublicUser(userLean);
    if (String(viewerId) !== String(id)) {
      delete user.wallet;
    } else {
      const w = userLean.wallet;
      user.wallet =
        w == null || w === ""
          ? 0
          : Number.isFinite(Number(w))
            ? Math.max(0, Number(w))
            : 0;
    }

    const [suggestions, enrollments] = await Promise.all([
      Suggestion.find({ userId: id })
        .select("title description createdAt updatedAt")
        .sort({ createdAt: -1 })
        .lean(),
      Enrollment.getUserEnrollments(id),
    ]);

    return {
      user,
      suggestions,
      enrollments,
    };
  } catch (error) {
    throw error;
  }
};

const addMoneyToWallet = async (req) => {
  try {
    const userId = req.userId;
    const raw = req.body?.amount;
    const amount = typeof raw === "number" ? raw : parseFloat(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("amount must be a positive number.");
    }

    const before = await User.findById(userId).select("wallet").lean();
    if (!before) throw new Error("User not found.");

    const balanceBefore = Number(before.wallet ?? 0);

    const updated = await User.findByIdAndUpdate(
      userId,
      { $inc: { wallet: amount } },
      { new: true, select: "wallet" }
    ).lean();

    const balanceAfter = Number(updated.wallet ?? 0);

    await WalletTransaction.create({
      userId,
      type: "credit",
      amount,
      reason: "add_money",
      title: "Money Added to Wallet",
      description: `Added ${amount} coins to wallet`,
      balanceBefore,
      balanceAfter,
    });

    return { wallet: balanceAfter };
  } catch (error) {
    throw error;
  }
};

const getAllTransactionHistory = async (req) => {
  try {
    const userId = req.userId;
    const page = Math.max(1, parseInt(req.query?.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit) || 10));
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      WalletTransaction.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WalletTransaction.countDocuments({ userId }),
    ]);

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      pageSize: limit,
    };
  } catch (error) {
    throw error;
  }
};

export const userService = {
  registerUser,
  loginUser,
  socialLogin,
  forgetPassword,
  verifyOtp,
  setPassowrd,
  setInitialPassword,
  updateUser,
  getUserDetails,
  changePassword,
  deleteAccount,
  logoutUser,
  getAllUsers,
  getWallet,
  addMoneyToWallet,
  getAllTransactionHistory,
  getUserProfileById,
};
