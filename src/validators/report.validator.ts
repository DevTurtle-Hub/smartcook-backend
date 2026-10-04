import Joi from "joi";

export const createReportSchema = Joi.object({
  targetType: Joi.string().valid("post", "comment", "recipe", "user").required().messages({
    "any.only": "targetType phải là post, comment, recipe, hoặc user",
    "any.required": "targetType là bắt buộc",
  }),
  targetId: Joi.string().required().messages({
    "any.required": "targetId là bắt buộc",
  }),
  reason: Joi.string()
    .valid("spam", "inappropriate", "harassment", "misleading", "other")
    .required()
    .messages({
      "any.only": "reason phải là spam, inappropriate, harassment, misleading, hoặc other",
      "any.required": "reason là bắt buộc",
    }),
  description: Joi.string().max(1000).allow("").optional(),
});

export const resolveReportSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "reviewed", "resolved", "dismissed", "action_taken")
    .required()
    .messages({
      "any.only": "status phải là pending, reviewed, resolved, dismissed, hoặc action_taken",
      "any.required": "status là bắt buộc",
    }),
  resolutionNotes: Joi.string().max(1000).allow("").optional(),
  action: Joi.string().valid("none", "hide", "delete", "ban").default("none").optional(),
});

export const getReportsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string()
    .valid("all", "pending", "reviewed", "resolved", "dismissed", "action_taken")
    .default("all"),
  targetType: Joi.string().valid("post", "comment", "recipe", "user").optional(),
});
