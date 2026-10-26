import Joi from "joi";

export const scanPhotoBodySchema = Joi.object({
  imageBase64: Joi.string().base64().max(7_000_000).required(),
  mimeType: Joi.string().valid("image/jpeg", "image/png", "image/webp", "image/gif").default("image/jpeg"),
});
