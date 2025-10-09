import Joi from "joi";

const addCollaboratorSchema = {
  body: Joi.object().keys({
    name: Joi.string().max(100).required().messages({
      "string.max": "Name must be at most 100 characters long.",
      "any.required": "Name is required.",
      "string.empty": "Name cannot be empty.",
    }),
    profile: Joi.string().required().messages({
      "any.required": "Profile is required.",
      "string.empty": "Profile cannot be empty.",
    }),
    phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]+$/).required().messages({
      "string.pattern.base": "Phone number must contain only numbers, +, -, spaces, and parentheses.",
      "any.required": "Phone number is required.",
      "string.empty": "Phone number cannot be empty.",
    }),
    profession: Joi.number().valid(1, 2, 3).required().messages({
      "any.only": "Profession must be one of: Raagi (1), Dhadhi (2), or Katha Vachak (3).",
      "any.required": "Profession is required.",
    }),
  }),
};

const updateCollaboratorSchema = {
  body: Joi.object().keys({
    name: Joi.string().max(100).optional().messages({
      "string.max": "Name must be at most 100 characters long.",
      "string.empty": "Name cannot be empty.",
    }),
    profile: Joi.string().optional().messages({
      "string.empty": "Profile cannot be empty.",
    }),
    phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().messages({
      "string.pattern.base": "Phone number must contain only numbers, +, -, spaces, and parentheses.",
      "string.empty": "Phone number cannot be empty.",
    }),
    profession: Joi.number().valid(1, 2, 3).optional().messages({
      "any.only": "Profession must be one of: Raagi (1), Dhadhi (2), or Katha Vachak (3).",
    }),
  }),
};

const collaboratorValidationSchemas = {
  addCollaboratorSchema,
  updateCollaboratorSchema,
};

export default collaboratorValidationSchemas;
