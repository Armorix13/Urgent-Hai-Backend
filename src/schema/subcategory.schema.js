import Joi from "joi";

const addSubCategorySchema = {
  body: Joi.object().keys({
    name: Joi.string().required().min(3).max(255).trim().messages({
      'string.base': 'Name must be a string',
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 3 characters long',
      'string.max': 'Name cannot be longer than 255 characters',
      'any.required': 'Name is required',
    }),
    description: Joi.string().optional().max(500).trim().messages({
      'string.base': 'Description must be a string',
      'string.max': 'Description cannot be longer than 500 characters',
    }),
    image: Joi.string().optional().uri().trim().messages({
      'string.base': 'Image URL must be a string',
      'string.uri': 'Image URL must be a valid URI',
    }),
    categoryId: Joi.string().required().length(24).hex().messages({
        'string.base': 'ID must be a string',
        'string.length': 'ID must be exactly 24 characters',
        'string.hex': 'ID must be a valid hexadecimal string',
        'any.required': 'ID is required',
      }),
  })
};

const updateSubCategorySchema = {
  params: Joi.object().keys({
    id: Joi.string().required().length(24).hex().messages({
      'string.base': 'ID must be a string',
      'string.length': 'ID must be exactly 24 characters',
      'string.hex': 'ID must be a valid hexadecimal string',
      'any.required': 'ID is required',
    }),
  }),
  body: Joi.object().keys({
    name: Joi.string().optional().min(3).max(255).trim().messages({
      'string.base': 'Name must be a string',
      'string.min': 'Name must be at least 3 characters long',
      'string.max': 'Name cannot be longer than 255 characters',
    }),
    description: Joi.string().optional().max(500).trim().messages({
      'string.base': 'Description must be a string',
      'string.max': 'Description cannot be longer than 500 characters',
    }),
    image: Joi.string().optional().uri().trim().messages({
      'string.base': 'Image URL must be a string',
      'string.uri': 'Image URL must be a valid URI',
    }),
    categoryId: Joi.string().optional().length(24).hex().messages({
        'string.base': 'ID must be a string',
        'string.length': 'ID must be exactly 24 characters',
        'string.hex': 'ID must be a valid hexadecimal string',
        'any.required': 'ID is required',
      }),
  })
};

const deleteSubCategorySchema = {
  params: Joi.object().keys({
    id: Joi.string().required().length(24).hex().messages({
      'string.base': 'ID must be a string',
      'string.length': 'ID must be exactly 24 characters',
      'string.hex': 'ID must be a valid hexadecimal string',
      'any.required': 'ID is required',
    }),
  })
};

const getSubCategorySchema = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional().messages({
      'number.base': 'Page must be a number',
      'number.min': 'Page must be at least 1',
    }),
    limit: Joi.number().integer().min(1).optional().messages({
      'number.base': 'Limit must be a number',
      'number.min': 'Limit must be at least 1',
    }),
  })
};

export const subcategorySchemas = {
  addSubCategorySchema,
  updateSubCategorySchema,
  deleteSubCategorySchema,
  getSubCategorySchema
};
