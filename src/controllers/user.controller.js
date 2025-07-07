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
    await userService.verifyOtp(req);
    return res.status(200).json({
      success: true,
      message: "otp verified successfully!",
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

export const userController = {
  registerUser,
  loginUser,
  forgetPassword,
  updateUser,
  getUserDetails,
  changePassword,
  verifyOtp,
  resetPassword,
  deleteAccount,
};
