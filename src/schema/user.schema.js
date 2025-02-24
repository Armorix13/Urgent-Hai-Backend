import Joi from "joi";

const registerUserSchema = {
    body: Joi.object().keys({
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email address.',
            'any.required': 'Email is required.'
        }),
        password: Joi.string().min(8).required().messages({
            'string.min': 'Password must be at least 8 characters long.',
            'any.required': 'Password is required.'
        }),
        name: Joi.string().min(3).required().messages({
            'string.min': 'Name must be at least 3 characters long.',
            'any.required': 'Name is required.'
        }),
        phoneNumber: Joi.string().pattern(/^[0-9]+$/).min(10).max(15).required().messages({
            'string.pattern.base': 'Phone number must contain only digits.',
            'string.min': 'Phone number must be at least 10 digits long.',
            'string.max': 'Phone number must not exceed 15 digits.',
            'any.required': 'Phone number is required.'
        }),
        countryCode: Joi.string().required().messages({
            'any.required': 'Country code is required.',
          }),
        deviceType: Joi.number().valid(1, 2).required().messages({
            'any.only': 'Device type must be either Android (1) or iOS (2).',
            'any.required': 'Device type is required.'
        }),
        deviceToken: Joi.string().required().messages({
            'any.required': 'Device Token is required.'   
        }),
        role: Joi.number().valid(1, 2).default(1).required().messages({
            'any.only': 'Role must be either Customer (1) or Driver (2).'
        }),
    })
};

const loginUserSchema = {
    body: Joi.object().keys({
      email: Joi.string().email().optional().messages({
        'string.email': 'Please provide a valid email address.',
      }),
      phoneNumber: Joi.string().pattern(/^[0-9]+$/).optional().messages({
        'string.pattern.base': 'Phone number must contain only digits.',
      }),
      password: Joi.string().min(8).required().messages({
        'string.min': 'Password must be at least 8 characters long.',
        'any.required': 'Password is required.',
      }),
      countryCode: Joi.string().required().messages({
        'any.required': 'Country code is required.',
      }),
      deviceType: Joi.number().valid(1, 2).required().messages({
        'any.only': 'Device type must be either Android (1) or iOS (2).',
        'any.required': 'Device type is required.',
      }),
      deviceToken: Joi.string().required().messages({
        'any.required': 'Device Token is required.',
      }),
    })
      .xor('email', 'phoneNumber')
  };
  

const forgetPasswordSchema = {
    body: Joi.object().keys({
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email address.',
            'any.required': 'Email is required.'
        }),
    })
};

const verifyOtpSchema = {
    body: Joi.object().keys({
        otp: Joi.number().required().messages({
            'any.required': 'OTP is required.',
        }),
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email address.',
            'any.required': 'Email is required.'
        }),
    })
};

const updateUserSchema = {
    body: Joi.object().keys({
        name: Joi.string().min(3).optional().messages({
            'string.min': 'Name must be at least 3 characters long.',
        }),
        email: Joi.string().email().optional().messages({
            'string.email': 'Please provide a valid email address.'
        }),
        phoneNumber: Joi.string().pattern(/^[0-9]+$/).min(10).max(15).optional().messages({
            'string.pattern.base': 'Phone number must contain only digits.',
            'string.min': 'Phone number must be at least 10 digits long.',
            'string.max': 'Phone number must not exceed 15 digits.',
            'any.required': 'Phone number is required.'
        }),
        countryCode: Joi.string().optional().messages({
            'any.required': 'Country code is required.',
          }),
        timeZone: Joi.string().optional().messages({
            'string.base': 'Time zone must be a valid string.',
        }),
        profileImage: Joi.string().uri().optional().messages({
            'string.uri': 'Profile image must be a valid URL.',
        }),
        longitude: Joi.number().optional(),
        latitude: Joi.number().optional(),
        gender: Joi.string().valid('male', 'female', 'other').optional().messages({
            'any.only': 'Gender must be one of "male", "female", or "other".',
        }),
        address: Joi.string().optional(),
    })
};

const changePasswordSchema = {
    body: Joi.object().keys({
        oldPassword: Joi.string().min(8).required().messages({
            'string.min': 'Old password must be at least 8 characters long.',
            'any.required': 'Old password is required.'
        }),
        newPassword: Joi.string().min(8).required().not(Joi.ref('oldPassword')).messages({
            'string.min': 'New password must be at least 8 characters long.',
            'any.required': 'New password is required.',
            'any.invalid': 'New password cannot be the same as the old password.'
        }),
    })
};

const userValidationSchemas = {
    registerUserSchema,
    loginUserSchema,
    forgetPasswordSchema,
    verifyOtpSchema,
    updateUserSchema,
    changePasswordSchema
};

export default userValidationSchemas;
