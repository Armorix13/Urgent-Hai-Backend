import express from "express";
import { userController } from "../controllers/user.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import userValidationSchemas from "../schema/user.schema.js";

const userRoute = express.Router();


userRoute.post("/user-register", validate(userValidationSchemas.registerUserSchema), userController.registerUser);
userRoute.post("/user-login", validate(userValidationSchemas.loginUserSchema), userController.loginUser);
userRoute.post("/forget-password", validate(userValidationSchemas.forgetPasswordSchema), userController.forgetPassword);
userRoute.post("/verify-otp", validate(userValidationSchemas.verifyOtpSchema), userController.verifyOtp);
userRoute.put("/user-update", validate(userValidationSchemas.updateUserSchema), authenticate, userController.updateUser);
userRoute.get("/user-detail", authenticate, userController.getUserDetails);
userRoute.put("/change-password", validate(userValidationSchemas.changePasswordSchema), authenticate, userController.changePassword);
userRoute.delete("/delete-account", authenticate, userController.deleteAccount);


export default userRoute;