import Joi from "joi";

export const createCategorySchema = Joi.object({
  code: Joi.string().trim().lowercase().min(2).max(30).required().messages({
    "any.required": "Category code is required",
  }),
  name: Joi.string().trim().min(2).max(50).required().messages({
    "any.required": "Category name is required",
  }),
  icon: Joi.string().trim().optional(),
  order: Joi.number().integer().min(0).optional(),
  description: Joi.string().trim().allow("").optional(),
  isActive: Joi.boolean().optional(),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional(),
  icon: Joi.string().trim().optional(),
  order: Joi.number().integer().min(0).optional(),
  description: Joi.string().trim().allow("").optional(),
  isActive: Joi.boolean().optional(),
});
