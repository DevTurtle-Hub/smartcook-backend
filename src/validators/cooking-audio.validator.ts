import Joi from "joi";

export const cookingAudioSchema = Joi.object({
  audioBase64: Joi.string().base64().max(2_800_000).required(),
  mimeType: Joi.string().valid("audio/mp4", "audio/m4a", "audio/webm", "audio/wav").required(),
});
