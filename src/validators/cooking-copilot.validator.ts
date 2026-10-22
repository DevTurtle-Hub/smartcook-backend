import Joi from "joi";

const stepSchema = Joi.object({
  stepNumber: Joi.number().integer().min(1).max(100).required(),
  title: Joi.string().trim().max(160).required(),
  description: Joi.string().allow("").max(1600).required(),
  timerMinutes: Joi.number().min(0).max(1440),
});

export const cookingCopilotSchema = Joi.object({
  recipeTitle: Joi.string().trim().max(160).required(),
  currentStep: stepSchema.required(),
  userVoiceText: Joi.string().trim().max(600).required(),
  stepTimer: Joi.object({
    targetMinutes: Joi.number().min(0).max(1440),
    elapsedSeconds: Joi.number().min(0).max(86400),
    remainingSeconds: Joi.number().min(0).max(86400),
    isRunning: Joi.boolean(),
    isOverdue: Joi.boolean(),
    overdueSeconds: Joi.number().min(0).max(86400),
  }),
  recipeContext: Joi.object({
    servings: Joi.string().allow("").max(80),
    nutrition: Joi.object({
      calories: Joi.number().min(0).max(100000),
      proteinGrams: Joi.number().min(0).max(100000),
      carbsGrams: Joi.number().min(0).max(100000),
      fatGrams: Joi.number().min(0).max(100000),
      fiberGrams: Joi.number().min(0).max(100000),
      sugarGrams: Joi.number().min(0).max(100000),
      sodiumMilligrams: Joi.number().min(0).max(1000000),
      basis: Joi.string().valid("per_serving", "whole_recipe", "unspecified"),
    }),
    ingredients: Joi.array().items(Joi.object({
      name: Joi.string().trim().max(120).required(), amount: Joi.string().allow("").max(100).required(),
    })).max(40).required(),
    steps: Joi.array().items(stepSchema).max(30).required(),
  }),
  conversationHistory: Joi.array().items(Joi.object({
    role: Joi.string().valid("user", "assistant").required(),
    text: Joi.string().trim().max(350).required(),
  })).max(6),
});

export const cookingAdviceSchema = Joi.object({
  scope: Joi.string().valid("in_scope", "out_of_scope", "needs_clarification").required(),
  speechReply: Joi.string().trim().max(600).required(),
  action: Joi.string().valid("NONE", "TROUBLESHOOT").default("NONE"),
  suggestedQuickReplies: Joi.array().items(Joi.string().trim().max(60)).max(3).default([]),
});

// Ask the provider for the same shape that we validate locally.
export const cookingAdviceJsonSchema = {
  type: "object",
  properties: {
    scope: { type: "string", enum: ["in_scope", "out_of_scope", "needs_clarification"] },
    speechReply: { type: "string", maxLength: 600 },
    action: { type: "string", enum: ["NONE", "TROUBLESHOOT"] },
    suggestedQuickReplies: { type: "array", maxItems: 3, items: { type: "string", maxLength: 60 } },
  },
  required: ["scope", "speechReply", "action", "suggestedQuickReplies"],
};
