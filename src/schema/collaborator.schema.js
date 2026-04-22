import Joi from "joi";
import mongoose from "mongoose";

const deviceTypeSchema = Joi.alternatives()
  .try(
    Joi.number().valid(1, 2),
    Joi.string()
      .trim()
      .lowercase()
      .valid("1", "2", "ios", "iphone", "ipad", "android", "mobile", "web")
  )
  .optional()
  .messages({
    "any.only": "deviceType must be 1 (iOS) or 2 (Android).",
  });

const deviceTokenSchema = Joi.string().optional().allow("", null).messages({
  "string.base": "deviceToken must be a string.",
});

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation");

const professionString = Joi.string().trim().min(1).max(120);

const contentItemSchema = Joi.object({
  _id: objectId.optional(),
  title: Joi.string().required().messages({
    "any.required": "Content title is required.",
    "string.empty": "Content title cannot be empty.",
  }),
  url: Joi.string().uri().required().messages({
    "any.required": "Content URL is required.",
    "string.uri": "Content URL must be a valid URI.",
  }),
  description: Joi.string().allow("", null).optional(),
  thumbnail: Joi.string().allow("", null).optional(),
  duration: Joi.string().allow("", null).optional(),
  order: Joi.number().integer().min(0).optional(),
});

const sectionItemSchema = Joi.object({
  _id: objectId.optional(),
  title: Joi.string().required().messages({
    "any.required": "Section title is required.",
    "string.empty": "Section title cannot be empty.",
  }),
  description: Joi.string().allow("", null).optional(),
  isActive: Joi.boolean().optional(),
  content: Joi.array().items(contentItemSchema).optional(),
  order: Joi.number().integer().min(0).optional(),
});

const addCollaboratorSchema = {
  body: Joi.object()
    .keys({
      name: Joi.string().max(100).required().messages({
        "string.max": "Name must be at most 100 characters long.",
        "any.required": "Name is required.",
        "string.empty": "Name cannot be empty.",
      }),
      profile: Joi.string().required().messages({
        "any.required": "Profile is required.",
        "string.empty": "Profile cannot be empty.",
      }),
      coverProfile: Joi.string().allow("", null).optional(),
      phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]+$/).required().messages({
        "string.pattern.base": "Phone number must contain only numbers, +, -, spaces, and parentheses.",
        "any.required": "Phone number is required.",
        "string.empty": "Phone number cannot be empty.",
      }),
      email: Joi.string().email().optional().messages({
        "string.email": "Please provide a valid email address.",
      }),
      address: Joi.string().trim().max(1000).allow("", null).optional(),
      bio: Joi.string().trim().max(500).allow("", null).optional(),
      profession: professionString.optional(),
      professionValue: professionString.optional(),
      password: Joi.alternatives()
        .try(
          Joi.string().min(6).max(128).messages({
            "string.min": "Password must be at least 6 characters.",
          }),
          Joi.valid(null, "")
        )
        .optional(),
    })
    .or("profession", "professionValue")
    .messages({
      "object.missing": "Either profession or professionValue is required.",
    }),
};

const updateCollaboratorSchema = {
  params: Joi.object().keys({
    id: objectId.required(),
  }),
  body: Joi.object().keys({
    name: Joi.string().max(100).optional().messages({
      "string.max": "Name must be at most 100 characters long.",
      "string.empty": "Name cannot be empty.",
    }),
    profile: Joi.string().optional().messages({
      "string.empty": "Profile cannot be empty.",
    }),
    coverProfile: Joi.string().allow("", null).optional(),
    phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().messages({
      "string.pattern.base": "Phone number must contain only numbers, +, -, spaces, and parentheses.",
      "string.empty": "Phone number cannot be empty.",
    }),
    email: Joi.string().email().allow("", null).optional().messages({
      "string.email": "Please provide a valid email address.",
    }),
    address: Joi.string().trim().max(1000).allow("", null).optional(),
    bio: Joi.string().trim().max(500).allow("", null).optional(),
    profession: professionString.optional(),
    professionValue: professionString.optional(),
    password: Joi.alternatives()
      .try(
        Joi.string().min(6).max(128).messages({
          "string.min": "Password must be at least 6 characters.",
        }),
        Joi.valid(null, "")
      )
      .optional(),
    sections: Joi.array().items(sectionItemSchema).optional(),
  }),
};

/** PATCH /collaborator/me — profile + optional password change (no `sections`). */
const updateCollaboratorMeSchema = {
  body: Joi.object({
    name: Joi.string().max(100).trim().allow("", null).optional(),
    profile: Joi.string().trim().max(2048).allow("", null).optional(),
    coverProfile: Joi.string().trim().max(2048).allow("", null).optional(),
    phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]+$/).allow("", null).optional().messages({
      "string.pattern.base": "Phone number must contain only numbers, +, -, spaces, and parentheses.",
    }),
    email: Joi.string().email().allow("", null).optional(),
    address: Joi.string().trim().max(1000).allow("", null).optional(),
    bio: Joi.string().trim().max(500).allow("", null).optional(),
    profession: professionString.allow("", null).optional(),
    professionValue: professionString.allow("", null).optional(),
    currentPassword: Joi.string().allow("", null).optional(),
    newPassword: Joi.string().min(8).max(128).allow("", null).optional().messages({
      "string.min": "New password must be at least 8 characters.",
    }),
  })
    .min(1)
    .messages({
      "object.min": "At least one field is required.",
    }),
};

const deleteCollaboratorSchema = {
  params: Joi.object().keys({
    id: objectId.required(),
  }),
};

/** POST /collaborator/set-password — identify by email and/or phoneNumber, set password (hashed). */
const setCollaboratorPasswordSchema = {
  body: Joi.object({
    email: Joi.string().trim().email().optional().messages({
      "string.email": "Please provide a valid email address.",
    }),
    phoneNumber: Joi.string()
      .trim()
      .pattern(/^[0-9+\-\s()]+$/)
      .optional()
      .messages({
        "string.pattern.base":
          "Phone number must contain only numbers, +, -, spaces, and parentheses.",
      }),
    password: Joi.string().min(8).max(128).required().messages({
      "any.required": "Password is required.",
      "string.min": "Password must be at least 8 characters.",
      "string.empty": "Password cannot be empty.",
    }),
  }).custom((value, helpers) => {
    const email = value.email != null ? String(value.email).trim() : "";
    const phone = value.phoneNumber != null ? String(value.phoneNumber).trim() : "";
    if (!email && !phone) {
      return helpers.message("Either email or phoneNumber is required.");
    }
    return value;
  }),
};

const loginCollaboratorSchema = {
  body: Joi.object()
    .keys({
      email: Joi.string().email().optional().messages({
        "string.email": "Please provide a valid email address.",
      }),
      phoneNumber: Joi.string().trim().max(20).optional().messages({
        "string.max": "Phone number must be at most 20 characters.",
      }),
      password: Joi.string().min(8).required().messages({
        "string.min": "Password must be at least 8 characters long.",
        "any.required": "Password is required.",
      }),
      deviceType: deviceTypeSchema,
      deviceToken: deviceTokenSchema,
    })
    .xor("email", "phoneNumber")
    .messages({
      "object.xor": "Provide either email or phoneNumber, not both.",
      "object.missing": "Either email or phoneNumber is required.",
    }),
};

const lookupCollaboratorSchema = {
  body: Joi.object()
    .keys({
      email: Joi.string().email().optional().messages({
        "string.email": "Please provide a valid email address.",
      }),
      phoneNumber: Joi.string().trim().max(20).optional().messages({
        "string.max": "Phone number must be at most 20 characters.",
      }),
    })
    .xor("email", "phoneNumber")
    .messages({
      "object.xor": "Provide either email or phoneNumber, not both.",
      "object.missing": "Either email or phoneNumber is required.",
    }),
};

const collaboratorValidationSchemas = {
  addCollaboratorSchema,
  updateCollaboratorSchema,
  updateCollaboratorMeSchema,
  deleteCollaboratorSchema,
  setCollaboratorPasswordSchema,
  loginCollaboratorSchema,
  lookupCollaboratorSchema,
};

export default collaboratorValidationSchemas;
