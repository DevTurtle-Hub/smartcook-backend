import Joi from "joi";

export const setMealSlotSchema = Joi.object({
  weekDate: Joi.string().isoDate().optional().messages({
    "string.isoDate": "weekDate phải có định dạng ngày hợp lệ (YYYY-MM-DD)",
  }),
  dayOfWeek: Joi.string()
    .valid("Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN")
    .required()
    .messages({
      "any.only": "dayOfWeek phải là một trong: Thứ 2, Thứ 3, Thứ 4, Thứ 5, Thứ 6, Thứ 7, CN",
      "any.required": "dayOfWeek là bắt buộc",
    }),
  slot: Joi.string()
    .valid("Bữa Sáng", "Bữa Trưa", "Bữa Tối", "Bữa Phụ")
    .required()
    .messages({
      "any.only": "slot phải là: Bữa Sáng, Bữa Trưa, Bữa Tối hoặc Bữa Phụ",
      "any.required": "slot là bắt buộc",
    }),
  time: Joi.string().trim().optional(),
  recipeId: Joi.string().hex().length(24).optional().messages({
    "string.length": "recipeId phải là ObjectId 24 ký tự",
  }),
  customTitle: Joi.string().trim().max(150).optional(),
  calories: Joi.number().min(0).optional(),
  isCooked: Joi.boolean().optional(),
  notes: Joi.string().trim().max(500).optional(),
});

export const addCartItemSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Tên nguyên liệu không được để trống",
    "any.required": "Tên nguyên liệu là bắt buộc",
  }),
  amount: Joi.string().trim().max(50).default("1"),
  price: Joi.number().min(0).default(0),
  category: Joi.string().trim().max(50).default("Rau củ"),
  recipeTitle: Joi.string().trim().max(150).optional(),
});

export const updateBoughtSchema = Joi.object({
  bought: Joi.boolean().required().messages({
    "any.required": "Trạng thái bought là bắt buộc",
  }),
});
