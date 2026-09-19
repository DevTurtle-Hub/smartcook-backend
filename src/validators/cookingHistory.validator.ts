import Joi from "joi";

export const createCookingHistorySchema = Joi.object({
  recipeId: Joi.string().trim().required().messages({
    "any.required": "Recipe ID is required",
    "string.empty": "Recipe ID cannot be empty",
  }),
  recipeName: Joi.string().trim().required().messages({
    "any.required": "Recipe name is required",
    "string.empty": "Recipe name cannot be empty",
  }),
  image: Joi.string().trim().uri().allow("").optional(),
  durationMinutes: Joi.number().min(1).max(720).required().messages({
    "any.required": "Duration in minutes is required",
    "number.min": "Duration must be at least 1 minute",
  }),
  servings: Joi.number().min(1).max(50).default(2).optional(),
  usedIngredients: Joi.array().items(Joi.string().trim()).default([]).optional(),
  calories: Joi.number().min(0).max(10000).default(0).optional(),
  rating: Joi.number().min(1).max(5).optional(),
  cookedAt: Joi.date().optional(),
});
