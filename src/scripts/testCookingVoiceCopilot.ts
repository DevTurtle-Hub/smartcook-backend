import dotenv from "dotenv";
dotenv.config();

import { aiService } from "../services/ai.service";

async function runVoiceCopilotTest() {
  console.log("==========================================================================");
  console.log("    KIỂM THỬ TRỢ LÝ GIỌNG NÓI NẤU ĂN THỜI GIAN THỰC (AI VOICE COPILOT)    ");
  console.log("==========================================================================\n");

  const testCases = [
    {
      name: "Kịch bản 1: Thịt chưa chín / cần thêm thời gian (NONE: chỉ tư vấn, không tự cộng giờ)",
      payload: {
        recipeTitle: "Ức gà xào ớt chuông sốt tiêu đen",
        currentStep: {
          stepNumber: 3,
          title: "Xào ức gà với ớt chuông",
          description: "Cho ức gà vào xào săn trên lửa lớn khoảng 4 phút đến khi chín tới, sau đó cho ớt chuông vào đảo đều.",
        },
        stepTimer: {
          targetMinutes: 4,
          elapsedSeconds: 260,
          isOverdue: true,
          overdueSeconds: 20,
        },
        userVoiceText: "Thịt gà bên trong vẫn còn hơi hồng và chưa chín hẳn thì làm sao?",
      },
      expectedAction: "NONE",
    },
    {
      name: "Kịch bản 2: Báo hoàn thành / chuyển bước tiếp theo (NEXT_STEP)",
      payload: {
        recipeTitle: "Ức gà xào ớt chuông sốt tiêu đen",
        currentStep: {
          stepNumber: 3,
          title: "Xào ức gà với ớt chuông",
          description: "Cho ức gà vào xào săn trên lửa lớn khoảng 4 phút đến khi chín tới, sau đó cho ớt chuông vào đảo đều.",
        },
        stepTimer: {
          targetMinutes: 4,
          elapsedSeconds: 240,
          isOverdue: false,
        },
        userVoiceText: "Tôi nấu xong bước này rồi, chuyển sang bước tiếp theo đi",
      },
      expectedAction: "NEXT_STEP",
    },
    {
      name: "Kịch bản 3: Yêu cầu nghe lại hướng dẫn bước hiện tại (REPEAT_STEP)",
      payload: {
        recipeTitle: "Ức gà xào ớt chuông sốt tiêu đen",
        currentStep: {
          stepNumber: 2,
          title: "Ướp thịt gà",
          description: "Trộn ức gà với 1 muỗng tiêu đen, 1 muỗng hạt nêm và 1 muỗng dầu hào trong 10 phút.",
        },
        userVoiceText: "Đọc lại cho tôi nghe bước này cần ướp những gia vị gì với",
      },
      expectedAction: "REPEAT_STEP",
    },
    {
      name: "Kịch bản 4: Xử lý sự cố khi nấu - Bị mặn / cháy (TROUBLESHOOT)",
      payload: {
        recipeTitle: "Canh chua cá lóc",
        currentStep: {
          stepNumber: 4,
          title: "Nêm gia vị cho nồi canh",
          description: "Cho me, đường, nước mắm vào nồi canh khuấy đều và đun sôi.",
        },
        userVoiceText: "Lỡ tay cho nhiều nước mắm bị mặn quá rồi, cứu mình với",
      },
      expectedAction: "TROUBLESHOOT",
    },
  ];

  let passed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`\n🔹 [${i + 1}/${testCases.length}] ${tc.name}`);
    console.log(`🗣️ Câu nói của người dùng: "${tc.payload.userVoiceText}"`);

    const startTime = Date.now();
    try {
      const result = await aiService.cookingVoiceCopilot("test-user-id", tc.payload);
      const latencyMs = Date.now() - startTime;

      console.log(`⏱️ Độ trễ phản hồi: ${latencyMs}ms`);
      console.log(`🔊 Loa đọc (speechReply): "${result.speechReply}"`);
      console.log(`⚡ Action điều khiển: [${result.action}]`);
      if (result.actionPayload) {
        console.log(`📦 Action Payload:`, JSON.stringify(result.actionPayload));
      }
      console.log(`💡 Quick Replies:`, result.suggestedQuickReplies?.join(" | ") || "Không có");

      const wordCount = result.speechReply.split(/\s+/).length;
      console.log(`📝 Số từ trong câu đọc: ${wordCount} từ (Quy tắc <= 35 từ: ${wordCount <= 35 ? "✅ ĐẠT" : "⚠️ HƠI DÀI"})`);

      // Action validation
      if (result.action === tc.expectedAction || (tc.expectedAction === "TROUBLESHOOT" && (result.action === "NONE" || result.action === "TROUBLESHOOT"))) {
        console.log(`✅ Kết quả: ĐẠT chuẩn hành động (${result.action})`);
        passed++;
      } else {
        console.log(`ℹ️ Kết quả: AI chọn [${result.action}] (Kỳ vọng: ${tc.expectedAction})`);
      }
    } catch (err: any) {
      console.error(`❌ Lỗi khi test kịch bản ${i + 1}:`, err?.message || err);
    }
  }

  console.log(`\n==========================================================================`);
  console.log(`🎉 HOÀN TẤT KIỂM THỬ: ${passed}/${testCases.length} KỊCH BẢN ĐẠT`);
  console.log(`==========================================================================\n`);
  process.exit(passed === testCases.length ? 0 : 1);
}

runVoiceCopilotTest();
