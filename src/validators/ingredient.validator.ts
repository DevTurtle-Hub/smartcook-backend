import Joi from "joi";
import { INGREDIENT_CATEGORIES } from "../models/Ingredient";

export const createIngredientSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "any.required": "Ingredient name is required",
  }),
  category: Joi.string()
    .valid(...INGREDIENT_CATEGORIES)
    .required()
    .messages({
      "any.only": `Category must be one of [${INGREDIENT_CATEGORIES.join(", ")}]`,
      "any.required": "Category is required",
    }),
  subCategory: Joi.string().trim().allow("").optional(),
  aliases: Joi.array().items(Joi.string().trim()).optional(),
  icon: Joi.string().trim().allow("").optional(),
  defaultUnit: Joi.string().trim().optional(),
  averagePrice: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional(),
});

export const updateIngredientSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  category: Joi.string()
    .valid(...INGREDIENT_CATEGORIES)
    .optional(),
  subCategory: Joi.string().trim().allow("").optional(),
  aliases: Joi.array().items(Joi.string().trim()).optional(),
  icon: Joi.string().trim().allow("").optional(),
  defaultUnit: Joi.string().trim().optional(),
  averagePrice: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional(),
});
