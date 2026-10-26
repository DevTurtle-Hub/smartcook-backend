import assert from "node:assert/strict";
import { geminiClient } from "../config/gemini";
import { aiService } from "../services/ai.service";

async function main() {
  // One real cooking question. Log response metadata, never credentials or raw errors.
  const original = geminiClient.models.generateContent.bind(geminiClient.models);
  geminiClient.models.generateContent = async (params) => {
    try {
      const response = await original(params);
      console.log(JSON.stringify({ model: params.model, finishReason: response.candidates?.[0]?.finishReason,
        usage: response.usageMetadata, text: response.text }));
      return response;
    } catch (error: unknown) {
      const status = typeof error === "object" && error !== null && "status" in error ? error.status : undefined;
      const message = error instanceof Error ? error.message : "unknown";
      const safeMessage = process.env.GEMINI_API_KEY ? message.split(process.env.GEMINI_API_KEY).join("[redacted]") : message;
      console.log(JSON.stringify({ providerFailure: true, status, name: error instanceof Error ? error.name : "unknown", reason: safeMessage.slice(0, 700) }));
      throw error;
    }
  };
  const result = await aiService.cookingVoiceCopilot("live-cooking-check", {
    recipeTitle: "Phở Bò Tái Lăn Hà Nội",
    currentStep: { stepNumber: 1, title: "Nấu nước dùng phở thơm lừng", description: "Nướng thơm gừng, hành tím, hoa hồi và thả vào nồi nước hầm xương đun sôi liu riu." },
    recipeContext: {
      ingredients: [{ name: "Nước hầm xương bò", amount: "800ml" }, { name: "Gừng, hoa hồi & thảo quả", amount: "1 ít" }],
      steps: [{ stepNumber: 1, title: "Nấu nước dùng", description: "Đun nước hầm xương sôi liu riu." }],
    },
    userVoiceText: "thì thì nước hầm bò xương bò chưa chín giờ cần phải làm gì?",
  });
  console.log(JSON.stringify({ result }));
  assert.equal(result.action, "TROUBLESHOOT");
  assert.ok(!result.speechReply.includes("chưa lấy được tư vấn"));
  geminiClient.models.generateContent = original;
}
main().catch((error) => { console.error(error instanceof assert.AssertionError ? error.message : "Live cooking check failed"); process.exitCode = 1; });
