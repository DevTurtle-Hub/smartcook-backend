import Joi from "joi";

export const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).required().messages({
    "string.empty": "First name cannot be empty",
    "any.required": "First name is required",
  }),
  lastName: Joi.string().trim().min(1).max(50).required().messages({
    "string.empty": "Last name cannot be empty",
    "any.required": "Last name is required",
  }),
  email: Joi.string().trim().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).max(128).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "any.required": "Password is required",
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    "any.required": "Refresh token is required",
  }),
});

export const googleAuthSchema = Joi.object({
  idToken: Joi.string().required().messages({
    "string.empty": "Google ID Token cannot be empty",
    "any.required": "Google ID Token is required",
  }),
});

export const onboardingSurveySchema = Joi.object({
  portion: Joi.string().valid("1", "2", "3-4", "5+").optional().messages({
    "any.only": "Portion must be one of ['1', '2', '3-4', '5+']",
  }),
  cuisines: Joi.array().items(Joi.string()).optional(),
  healthGoal: Joi.string().valid("healthy", "loss", "muscle", "budget").optional().messages({
    "any.only": "Health goal must be one of ['healthy', 'loss', 'muscle', 'budget']",
  }),
  restrictions: Joi.array().items(Joi.string()).optional(),
  tasteProfile: Joi.array().items(Joi.string()).optional(),
  cookingTime: Joi.string().valid("quick", "medium", "standard", "slow").optional().messages({
    "any.only": "Cooking time must be one of ['quick', 'medium', 'standard', 'slow']",
  }),
});

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).optional(),
  lastName: Joi.string().trim().min(1).max(50).optional(),
  avatar: Joi.string().uri().allow("").optional(),
});
