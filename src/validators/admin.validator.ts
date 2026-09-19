import Joi from "joi";

export const getUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().allow("").optional(),
  role: Joi.string().valid("user", "admin").optional(),
  isActive: Joi.boolean().optional(),
});

export const updateUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    "any.required": "Trạng thái isActive là bắt buộc",
    "boolean.base": "isActive phải là kiểu boolean",
  }),
});

export const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid("user", "admin").required().messages({
    "any.required": "Vai trò role là bắt buộc",
    "any.only": "Role phải là 'user' hoặc 'admin'",
  }),
});
