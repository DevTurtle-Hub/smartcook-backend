import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { foodVisionService } from "../services/food-vision.service";
import { geminiClient } from "../config/gemini";

async function main() {
  const original = geminiClient.models.generateContent.bind(geminiClient.models);
  geminiClient.models.generateContent = async (params) => {
    try { return await original(params); } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "unknown provider error";
      const safeMessage = process.env.GEMINI_API_KEY ? message.split(process.env.GEMINI_API_KEY).join("[redacted]") : message;
      console.log(safeMessage.slice(0, 1000));
      throw error;
    }
  };
  const image = readFileSync(resolve(__dirname, "../../../smartcook-mobile/assets/images/hero-teriyaki-bowl.jpg"));
  const result = await foodVisionService.analyze(image, "image/jpeg");
  assert.equal(result.isFood, true);
  assert.ok(result.dishes.length > 0);
  assert.ok(result.ingredients.length >= 3);
  assert.ok(result.ingredients.every((item) => item.source === "visible" || item.source === "inferred"));
  console.log(JSON.stringify({ title: result.title, dishes: result.dishes, ingredients: result.ingredients }, null, 2));
  console.log("PASS: real Gemini vision analysis of the repository food photograph (no database writes).");
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Live vision check failed; no sample results substituted."); process.exitCode = 1; });
