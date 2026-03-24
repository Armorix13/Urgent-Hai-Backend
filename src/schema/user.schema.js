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
    deviceType: Joi.alternatives()
      .try(Joi.number().valid(1, 2), Joi.string().trim().lowercase())
      .required()
      .messages({
        "any.required": "Device type is required.",
      }),
    age: Joi.number().required().messages({
      "any.required": "age is required.",
    }),
    deviceToken: Joi.string().required().messages({
      "any.required": "Device Token is required.",
    }),
    phoneNumber: Joi.string().trim().max(20).optional().messages({
      "string.max": "Phone number must be at most 20 characters.",
    }),
    countryCode: Joi.string().trim().max(10).optional().messages({
      "string.max": "Country code must be at most 10 characters.",
    }),
    gender: Joi.alternatives()
      .try(
        Joi.number().valid(1, 2, 3),
        Joi.string().valid("male", "female", "other", "Male", "Female", "Other")
      )
      .optional()
      .messages({
        "any.only": 'Gender must be 1/2/3 or "male"/"female"/"other".',
      }),
    language: Joi.alternatives()
      .try(
        Joi.string().valid(
          "Punjabi",
          "Urdu",
          "Faarsi",
          "Hindi",
          "English",
          "Spanish",
          "French"
        ),
        Joi.string().valid("en", "hi", "pa", "ur", "fa", "fr", "es")
      )
      .required()
      .messages({
        "any.required": "Language is required.",
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
      deviceType: Joi.alternatives()
        .try(Joi.number().valid(1, 2), Joi.string().trim().lowercase())
        .required()
        .messages({
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
  body: Joi.object()
    .keys({
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
      deviceType: Joi.alternatives()
        .try(
          Joi.number().valid(1, 2),
          Joi.string().trim().lowercase()
        )
        .optional(),
      deviceToken: Joi.string().optional().allow(""),
    })
    .options({ stripUnknown: true }),
};

const updateUserSchema = {
  body: Joi.object().keys({
    userName: Joi.string().max(30).optional().messages({
      "string.max": "Name must be at most 30 characters long.",
      "string.empty": "Name cannot be empty.",
    }),
    fullName: Joi.string().max(30).optional().messages({
      "string.max": "Name must be at most 30 characters long.",
      "string.empty": "Name cannot be empty.",
    }),
    email: Joi.string().email().optional().messages({
      "string.email": "Please provide a valid email address.",
    }),
    timeZone: Joi.string().optional().messages({
      "string.base": "Time zone must be a valid string.",
    }),
    profileImage: Joi.string()
      .max(500)
      .allow("", null)
      .optional()
      .messages({
        "string.max": "Profile image path/URL is too long.",
      }),
    longitude: Joi.number().optional(),
    latitude: Joi.number().optional(),
    gender: Joi.alternatives()
      .try(
        Joi.number().valid(1, 2, 3),
        Joi.string().valid("male", "female", "other", "Male", "Female", "Other")
      )
      .optional()
      .messages({
        "any.only": 'Gender must be 1/2/3 or "male"/"female"/"other".',
      }),
    address: Joi.string().optional(),
    age: Joi.number().min(1).max(120).optional().messages({
      "number.min": "Age must be at least 1.",
      "number.max": "Age must be at most 120.",
    }),
    phoneNumber: Joi.string().trim().max(20).optional().messages({
      "string.max": "Phone number must be at most 20 characters.",
    }),
    countryCode: Joi.string().trim().max(10).optional().messages({
      "string.max": "Country code must be at most 10 characters.",
    }),
    language: Joi.alternatives()
      .try(
        Joi.string().valid(
          "Punjabi",
          "Urdu",
          "Faarsi",
          "Hindi",
          "English",
          "Spanish",
          "French"
        ),
        Joi.string().valid("en", "hi", "pa", "ur", "fa", "fr", "es")
      )
      .optional()
      .messages({
        "any.only":
          'Language must be a supported code (e.g. en, hi) or full name: Punjabi, Urdu, Faarsi, Hindi, English, Spanish, French.',
      }),
  }),
};

const changePasswordSchema = {
  body: Joi.object()
    .keys({
      oldPassword: Joi.string()
        .trim()
        .min(8)
        .max(128)
        .required()
        .messages({
          "string.min": "Old password must be at least 8 characters long.",
          "string.max": "Old password is too long.",
          "any.required": "Old password is required.",
          "string.empty": "Old password cannot be empty.",
        }),
      newPassword: Joi.string()
        .trim()
        .min(8)
        .max(128)
        .required()
        .invalid(Joi.ref("oldPassword"))
        .messages({
          "string.min": "New password must be at least 8 characters long.",
          "string.max": "New password is too long.",
          "any.required": "New password is required.",
          "string.empty": "New password cannot be empty.",
          "any.invalid": "New password cannot be the same as the old password.",
        }),
    })
    .options({ stripUnknown: true }),
};

const socialLoginSchema = {
  body: Joi.object().keys({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address.",
      "any.required": "Email is required.",
    }),
    provider: Joi.string()
      .valid("google", "apple")
      .required()
      .messages({
        "any.only": "Provider must be google or apple.",
        "any.required": "Provider is required.",
      }),
    providerId: Joi.string().required().messages({
      "any.required": "Provider ID is required.",
      "string.empty": "Provider ID cannot be empty.",
    }),
    userName: Joi.string().trim().max(50).optional().messages({
      "string.max": "Name must be at most 50 characters long.",
    }),
    firstName: Joi.string().trim().max(30).optional().messages({
      "string.max": "First name must be at most 30 characters long.",
    }),
    lastName: Joi.string().trim().max(30).optional().messages({
      "string.max": "Last name must be at most 30 characters long.",
    }),
    profileImage: Joi.string().max(500).allow("", null).optional().messages({
      "string.max": "Profile image URL is too long.",
    }),
    deviceType: Joi.alternatives()
      .try(Joi.number().valid(1, 2), Joi.string().trim().lowercase())
      .required()
      .messages({
        "any.required": "Device type is required.",
      }),
    deviceToken: Joi.string().required().messages({
      "any.required": "Device token is required.",
    }),
    phoneNumber: Joi.string().trim().max(20).optional().messages({
      "string.max": "Phone number must be at most 20 characters.",
    }),
    countryCode: Joi.string().trim().max(10).optional().messages({
      "string.max": "Country code must be at most 10 characters.",
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
  socialLoginSchema,
  forgetPasswordSchema,
  verifyOtpSchema,
  updateUserSchema,
  changePasswordSchema,
  resetPasswordSchema,
};

export default userValidationSchemas;
