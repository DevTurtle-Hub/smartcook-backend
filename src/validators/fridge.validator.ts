import Joi from "joi";
import { INGREDIENT_CATEGORIES } from "../models/Ingredient";

export const addFridgeItemSchema = Joi.object({
  ingredientId: Joi.string().hex().length(24).optional(),
  name: Joi.string().trim().min(1).max(100).required().messages({
    "any.required": "Ingredient name is required",
  }),
  amount: Joi.string().trim().allow("").optional(),
  category: Joi.string()
    .valid(...INGREDIENT_CATEGORIES)
    .optional(),
  storageLocation: Joi.string()
    .valid("chilled", "frozen", "pantry")
    .optional(),
  expiryDate: Joi.date().iso().optional(),
  note: Joi.string().trim().allow("").optional(),
});

export const updateFridgeItemSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  amount: Joi.string().trim().allow("").optional(),
  category: Joi.string()
    .valid(...INGREDIENT_CATEGORIES)
    .optional(),
  storageLocation: Joi.string()
    .valid("chilled", "frozen", "pantry")
    .optional(),
  expiryDate: Joi.date().iso().allow(null).optional(),
  note: Joi.string().trim().allow("").optional(),
});
