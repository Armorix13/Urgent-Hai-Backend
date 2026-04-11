import { userService } from "../services/user.service.js";

const registerUser = async (req, res, next) => {
  try {
    const { email, message } = await userService.registerUser(req);
    return res.status(201).json({
      success: true,
      message,
      email,
    });
  } catch (error) {
    next(error);
  }
};

const socialLogin = async (req, res, next) => {
  try {
    const user = await userService.socialLogin(req);
    return res.status(200).json({
      success: true,
      message: "Social login successful!",
      user,
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const user = await userService.loginUser(req);
    return res.status(200).json({
      success: true,
      message: "user login successfully!",
      user,
    });
  } catch (error) {
    next(error);
  }
};

const forgetPassword = async (req, res, next) => {
  try {
    await userService.forgetPassword(req);
    return res.status(200).json({
      success: true,
      message: "otp sent to email successfully!",
    });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const data = await userService.verifyOtp(req);
    return res.status(200).json({
      success: true,
      message: "otp verified successfully!",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await userService.setPassowrd(req);
    return res.status(200).json({
      success: true,
      message: "password reset successfully!",
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req);
    return res.status(200).json({
      success: true,
      message: "user updated successfully!",
      user,
    });
  } catch (error) {
    next(error);
  }
};

const getUserDetails = async (req, res, next) => {
  try {
    const user = await userService.getUserDetails(req);
    return res.status(200).json({
      success: true,
      message: "user detail fetched successfully!",
      user,
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await userService.changePassword(req);
    return res.status(200).json({
      success: true,
      message: "password changed successfully!",
    });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    await userService.deleteAccount(req);
    return res.status(200).json({
      success: true,
      message: "user account deleted successfully!",
    });
  } catch (error) {
    next(error);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    await userService.logoutUser(req);
    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const data = await userService.getAllUsers(req);
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully!",
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getWallet = async (req, res, next) => {
  try {
    const data = await userService.getWallet(req);
    return res.status(200).json({
      success: true,
      message: "Wallet fetched successfully!",
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const addMoneyToWallet = async (req, res, next) => {
  try {
    const data = await userService.addMoneyToWallet(req);
    return res.status(200).json({
      success: true,
      message: "Money added to wallet successfully!",
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getTransactionHistory = async (req, res, next) => {
  try {
    const data = await userService.getAllTransactionHistory(req);
    return res.status(200).json({
      success: true,
      message: "Transaction history fetched successfully!",
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getUserProfileById = async (req, res, next) => {
  try {
    const data = await userService.getUserProfileById(req);
    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully!",
      user: data.user,
      suggestions: data.suggestions,
      enrollments: data.enrollments,
    });
  } catch (error) {
    next(error);
  }
};

export const userController = {
  registerUser,
  loginUser,
  socialLogin,
  forgetPassword,
  updateUser,
  getUserDetails,
  changePassword,
  verifyOtp,
  resetPassword,
  deleteAccount,
  logoutUser,
  getAllUsers,
  getWallet,
  addMoneyToWallet,
  getTransactionHistory,
  getUserProfileById,
};
