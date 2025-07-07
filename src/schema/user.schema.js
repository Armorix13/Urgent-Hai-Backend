import Joi from "joi";

const registerUserSchema = {
  body: Joi.object().keys({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address.",
      "any.required": "Email is required.",
    }),
    password: Joi.string().min(8).required().messages({
      "string.min": "Password must be at least 8 characters long.",
      "any.required": "Password is required.",
    }),
    userName: Joi.string().max(30).required().messages({
      "string.max": "Name must be at most 30 characters long.",
      "any.required": "Name is required.",
      "string.empty": "Name cannot be empty.",
    }),
    deviceType: Joi.number().valid(1, 2).required().messages({
      "any.only": "Device type must be either Android (1) or iOS (2).",
      "any.required": "Device type is required.",
    }),
    age: Joi.number().required().messages({
      "any.required": "age is required.",
    }),
    deviceToken: Joi.string().required().messages({
      "any.required": "Device Token is required.",
    }),
    gender: Joi.string().valid(1, 2, 3).optional().messages({
      "any.only": 'Gender must be one of "male", "female", or "other".',
    }),
    language: Joi.string().valid(1, 2, 3, 4, 5, 6, 7).optional().messages({
      "any.only":
        'Language must be one of "1", "2", "3", "4", "5", "6", or "7".',
    }),
  }),
};

const loginUserSchema = {
  body: Joi.object()
    .keys({
      email: Joi.string().email().optional().messages({
        "string.email": "Please provide a valid email address.",
      }),
      password: Joi.string().min(8).required().messages({
        "string.min": "Password must be at least 8 characters long.",
        "any.required": "Password is required.",
      }),
      deviceType: Joi.number().valid(1, 2).required().messages({
        "any.only": "Device type must be either Android (1) or iOS (2).",
        "any.required": "Device type is required.",
      }),
      deviceToken: Joi.string().required().messages({
        "any.required": "Device Token is required.",
      }),
    })
    .xor("email", "phoneNumber"),
};

const forgetPasswordSchema = {
  body: Joi.object().keys({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address.",
      "any.required": "Email is required.",
    }),
  }),
};

const verifyOtpSchema = {
  body: Joi.object().keys({
    type: Joi.number().required().messages({
      "any.required": "type is required.",
    }),
    otp: Joi.number().required().messages({
      "any.required": "OTP is required.",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address.",
      "any.required": "Email is required.",
    }),
  }),
};

const updateUserSchema = {
  body: Joi.object().keys({
    userName: Joi.string().max(30).optional().messages({
      "string.max": "Name must be at most 30 characters long.",
      "any.required": "Name is required.",
      "string.empty": "Name cannot be empty.",
    }),
    email: Joi.string().email().optional().messages({
      "string.email": "Please provide a valid email address.",
    }),
    timeZone: Joi.string().optional().messages({
      "string.base": "Time zone must be a valid string.",
    }),
    profileImage: Joi.string().uri().optional().messages({
      "string.uri": "Profile image must be a valid URL.",
    }),
    longitude: Joi.number().optional(),
    latitude: Joi.number().optional(),
    gender: Joi.string().valid(1, 2, 3).optional().messages({
      "any.only": 'Gender must be one of "male", "female", or "other".',
    }),
    address: Joi.string().optional(),
    age: Joi.number().optional().messages({
      "any.required": "age is required.",
    }),
    language: Joi.string().valid(1, 2, 3, 4, 5, 6, 7).optional().messages({
      "any.only":
        'Language must be one of "1", "2", "3", "4", "5", "6", or "7".',
    }),
  }),
};

const changePasswordSchema = {
  body: Joi.object().keys({
    oldPassword: Joi.string().min(8).required().messages({
      "string.min": "Old password must be at least 8 characters long.",
      "any.required": "Old password is required.",
    }),
    newPassword: Joi.string()
      .min(8)
      .required()
      .not(Joi.ref("oldPassword"))
      .messages({
        "string.min": "New password must be at least 8 characters long.",
        "any.required": "New password is required.",
        "any.invalid": "New password cannot be the same as the old password.",
      }),
  }),
};

const resetPasswordSchema = {
  body: Joi.object().keys({
    password: Joi.string().min(8).required().messages({
      "string.min": "password must be at least 8 characters long.",
      "any.required": "password is required.",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address.",
      "any.required": "Email is required.",
    }),
  }),
};

const userValidationSchemas = {
  registerUserSchema,
  loginUserSchema,
  forgetPasswordSchema,
  verifyOtpSchema,
  updateUserSchema,
  changePasswordSchema,
  resetPasswordSchema,
};

export default userValidationSchemas;
