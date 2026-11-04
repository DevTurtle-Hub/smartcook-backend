import Joi from "joi";
import { geminiClient, GEMINI_MODEL, GEMINI_CANDIDATE_MODELS } from "../config/gemini";
import { AppError, BadRequestError } from "../utils/errors";

const VALID_ICONS = new Set([
  "food-drumstick",
  "fruit-cherries",
  "food-apple",
  "fish",
  "leaf",
  "food-steak",
  "seed",
  "shaker",
  "bottle-tonic",
  "fruit-citrus",
  "egg",
]);

const ingredientSchema = Joi.object({
  name: Joi.string().trim().max(120).required(),
  confidence: Joi.string().pattern(/^(100|\d{1,2})%$/).required(),
  icon: Joi.string()
    .valid(...Array.from(VALID_ICONS))
    .default("food-apple"),
  source: Joi.string().valid("visible", "inferred").required(),
});

const resultSchema = Joi.object({
  isFood: Joi.boolean().required(),
  title: Joi.string().trim().max(180).required(),
  accuracy: Joi.number().min(0).max(100).required(),
  dishes: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().max(120).required(),
        confidence: Joi.string().pattern(/^(100|\d{1,2})%$/).required(),
      })
    )
    .max(10)
    .required(),
  ingredients: Joi.array().items(ingredientSchema).max(30).required(),
  pins: Joi.array()
    .items(
      Joi.object({
        text: Joi.string().max(100).required(),
        top: Joi.number().min(0).max(100).required(),
        left: Joi.number().min(0).max(100).required(),
      })
    )
    .max(10)
    .default([]),
  suggestedRecipe: Joi.object({
    title: Joi.string().max(160).required(),
    desc: Joi.string().max(800).required(),
    calories: Joi.number().min(0).max(10000).required(),
    durationMinutes: Joi.number().min(0).max(1440).required(),
    matchPercent: Joi.number().min(0).max(100).required(),
  }).required(),
});

export interface FoodPhotoAnalysis {
  isFood: boolean;
  title: string;
  accuracy: number;
  dishes: { name: string; confidence: string }[];
  ingredients: { name: string; confidence: string; icon: string; source: "visible" | "inferred" }[];
  pins: { text: string; top: number; left: number }[];
  suggestedRecipe: {
    title: string;
    desc: string;
    calories: number;
    durationMinutes: number;
    matchPercent: number;
  };
}

export function validateFoodPhoto(buffer: Buffer, mimeType: string): void {
  if (!buffer.length || buffer.length > 5 * 1024 * 1024) {
    throw new BadRequestError("Ảnh cần có dung lượng từ 1 byte đến 5 MB.");
  }
  const signatures: Record<string, boolean> = {
    "image/jpeg": buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
    "image/png": buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    "image/webp": buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP",
    "image/gif": /^GIF8[79]a$/.test(buffer.toString("ascii", 0, 6)),
  };
  if (!signatures[mimeType]) {
    throw new BadRequestError("Ảnh không hợp lệ. Vui lòng dùng JPEG, PNG hoặc WEBP.");
  }
}

/**
 * Chuẩn hóa icon thực phẩm về danh sách icon hợp lệ của ứng dụng di động
 */
function normalizeIcon(icon: string = "", name: string = ""): string {
  if (VALID_ICONS.has(icon)) return icon;
  const target = `${icon} ${name}`.toLowerCase();
  if (/gà|chicken|drumstick|vịt|chim|cánh gà|đùi gà|ngan|ngỗng/.test(target)) return "food-drumstick";
  if (/bò|beef|thịt|heo|pork|steak|sườn|ba chỉ|xúc xích|lạp xưởng|ham|bacon|giò|chả/.test(target)) return "food-steak";
  if (/cá|fish|tôm|shrimp|hải sản|seafood|mực|cua|nghêu|sò|sushi|sashimi|hàu|lươn|tảo|bạch tuộc|ngừ|hồi|ebiko|surimi/.test(target)) return "fish";
  if (/trứng|egg|cút/.test(target)) return "egg";
  if (/sốt|sauce|dầu|oil|nước mắm|nước tương|xì dầu|tonic|giấm|wasabi|mayo|mayonnaise|súp|nước dùng|dashi/.test(target)) return "bottle-tonic";
  if (/muối|tiêu|tiêu đen|ớt|gia vị|shaker|đường|bột ngọt|hạt nêm|curry|cà ri|sa tế/.test(target)) return "shaker";
  if (/hạt|mè|seed|cơm|gạo|rice|đậu|bean|ngô|bắp|vừng|bún|phở|mì|noodle|pasta|bánh mì|bread/.test(target)) return "seed";
  if (/chanh|cam|citrus|bưởi|quýt|chanh leo|tắc|quất/.test(target)) return "fruit-citrus";
  if (/rau|xà lách|salad|cải|hành|ngò|gừng|nấm|cà chua|bơ|avocado|leaf|rong biển|dưa leo|củ cải|gari|hẹ|thì là|tỏi/.test(target)) return "leaf";
  if (/táo|trái cây|hoa quả|fruit|dâu|cherry|chuối|dưa hấu|xoài|thơm|dứa/.test(target)) return "fruit-cherries";
  return "food-apple";
}

/**
 * Chuẩn hóa giá trị confidence về dạng chuỗi "XX%"
 */
function normalizeConfidence(val: unknown): string {
  if (typeof val === "string") {
    const match = val.match(/\d+/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      const num = Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 85;
      return `${num}%`;
    }
  } else if (typeof val === "number" && Number.isFinite(val)) {
    const num = Math.min(100, Math.max(0, Math.round(val)));
    return `${num}%`;
  }
  return "85%";
}

/**
 * Tiền xử lý và chuẩn hóa dữ liệu trả về từ Gemini trước khi validate qua Joi
 */
function sanitizeVisionResult(raw: any): any {
  if (!raw || typeof raw !== "object") return raw;

  const data = { ...raw };

  // 1. Chuẩn hóa isFood (nếu không được định nghĩa rõ ràng thì suy đoán)
  if (data.isFood !== false && data.isFood !== true) {
    data.isFood = true;
  }

  // 2. Chuẩn hóa dishes (chỉ xử lý khi dishes là mảng)
  if (Array.isArray(data.dishes)) {
    data.dishes = data.dishes
      .filter((d: any) => d && (d.name || typeof d === "string"))
      .slice(0, 10)
      .map((d: any) => ({
        name: String(d?.name || d || "Món ăn").trim().slice(0, 120) || "Món ăn",
        confidence: normalizeConfidence(d?.confidence),
      }));
  }

  // 3. Chuẩn hóa title
  const rawTitle = typeof data.title === "string" ? data.title.trim() : "";
  data.title = rawTitle.slice(0, 180) || data.dishes?.[0]?.name || "Thực phẩm nhận diện";

  // 4. Chuẩn hóa accuracy
  let accuracy =
    typeof data.accuracy === "number"
      ? data.accuracy
      : parseFloat(String(data.accuracy || "").replace("%", "")) || 85;
  if (!Number.isFinite(accuracy)) accuracy = 85;
  data.accuracy = Math.max(0, Math.min(100, Math.round(accuracy)));

  // 5. Chuẩn hóa ingredients (chỉ xử lý khi ingredients là mảng)
  if (Array.isArray(data.ingredients)) {
    data.ingredients = data.ingredients
      .filter((item: any) => item && (item.name || typeof item === "string"))
      .slice(0, 30)
      .map((item: any) => {
        const name = String(item?.name || item || "Nguyên liệu").trim().slice(0, 120) || "Nguyên liệu";
        return {
          name,
          confidence: normalizeConfidence(item?.confidence),
          icon: normalizeIcon(item?.icon, name),
          source: item?.source === "inferred" ? "inferred" : "visible",
        };
      });
  }

  // 6. Chuẩn hóa pins (toạ độ an toàn 5% - 85% để ghim hiển thị chuẩn trên màn hình)
  if (Array.isArray(data.pins)) {
    data.pins = data.pins
      .filter((pin: any) => pin && typeof pin === "object")
      .slice(0, 8)
      .map((pin: any) => {
        const rawTop = pin.top ?? pin.y ?? pin.bottom ?? 25;
        const rawLeft = pin.left ?? pin.x ?? pin.right ?? 25;

        let top = typeof rawTop === "number" ? rawTop : parseFloat(String(rawTop).replace("%", ""));
        let left = typeof rawLeft === "number" ? rawLeft : parseFloat(String(rawLeft).replace("%", ""));

        if (!Number.isFinite(top)) top = 25;
        if (!Number.isFinite(left)) left = 25;

        // Nếu Gemini trả về toạ độ trên thang 0-1000 (bounding box pixel)
        if (top > 100) top = top / 10;
        if (left > 100) left = left / 10;

        top = Math.max(5, Math.min(85, Math.round(top)));
        left = Math.max(5, Math.min(80, Math.round(left)));

        const text = String(pin.text || pin.label || pin.name || "Nguyên liệu").trim().slice(0, 100) || "Nguyên liệu";

        return {
          text,
          top,
          left,
        };
      })
      .filter((pin: any) => Number.isFinite(pin.top) && Number.isFinite(pin.left));
  } else {
    data.pins = [];
  }

  // 7. Chuẩn hóa suggestedRecipe
  const rawRecipe = data.suggestedRecipe && typeof data.suggestedRecipe === "object" ? data.suggestedRecipe : {};
  data.suggestedRecipe = {
    title: String(rawRecipe.title || data.title || "Món ngon gợi ý").trim().slice(0, 160) || "Món ngon gợi ý",
    desc: String(rawRecipe.desc || "Gợi ý món ăn hấp dẫn chế biến từ nguyên liệu nhận diện.").trim().slice(0, 800) || "Gợi ý món ăn hấp dẫn.",
    calories: Math.max(0, Math.min(10000, parseInt(String(rawRecipe.calories || 0), 10) || 450)),
    durationMinutes: Math.max(0, Math.min(1440, parseInt(String(rawRecipe.durationMinutes || 0), 10) || 25)),
    matchPercent: Math.max(0, Math.min(100, parseInt(String(rawRecipe.matchPercent || data.accuracy || 90), 10) || 90)),
  };

  return data;
}

export const foodVisionService = {
  async analyze(buffer: Buffer, mimeType: string): Promise<FoodPhotoAnalysis> {
    validateFoodPhoto(buffer, mimeType);
    let raw: unknown;
    let lastError: unknown = null;

    const candidateModels = GEMINI_CANDIDATE_MODELS.length > 0 ? GEMINI_CANDIDATE_MODELS : [GEMINI_MODEL];

    for (const modelName of candidateModels) {
      try {
        const response = await geminiClient.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType, data: buffer.toString("base64") } },
                {
                  text: "Hãy thẩm định ẩm thực và phân tích chuyên sâu bức ảnh này (tên món, nguyên liệu nhìn thấy & suy đoán, toạ độ ghim thành phần, công thức đầu bếp gợi ý) theo đúng định dạng JSON yêu cầu.",
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
            temperature: 0.3,
            maxOutputTokens: 2500,
            httpOptions: { timeout: 45000, retryOptions: { attempts: 1 } },
            systemInstruction: `Bạn là Chuyên gia Giám định Ẩm thực & Bếp trưởng Trí tuệ Nhân tạo SmartCook (Executive Chef & Deep Culinary Vision Specialist).
Nhiệm vụ của bạn là phân tích sâu sắc, tinh tế và chuyên nghiệp bức ảnh món ăn hoặc nguyên liệu thực phẩm:

1. PHÂN TÍCH MÓN ĂN (dishes):
- Nhận diện chính xác tên các món ăn hoặc set ăn cụ thể với phong cách ẩm thực rõ ràng (ví dụ: 'Mâm Sushi & Sashimi Tổng Hợp Tokyo', 'Bò Bít Tết Sốt Tiêu Đen', 'Phở Bò Tái Lăn Hà Nội').
- Độ tin cậy (confidence) định dạng chuỗi phần trăm từ '85%' đến '99%'.

2. BÓC TÁCH NGUYÊN LIỆU CHUYÊN SÂU (ingredients):
- Nhận diện đầy đủ cả nguyên liệu nhìn thấy rõ (source: 'visible') và các thành phần cốt lõi tạo nên hương vị đặc trưng (source: 'inferred' như sốt ướp, gia vị ngấm, nước dùng, thảo mộc, bơ tỏi).
- Tên nguyên liệu cần cụ thể, giàu giá trị ẩm thực (ví dụ: 'Cá hồi Na Uy tươi phi lê', 'Cơm dẻo trộn giấm Sushi', 'Thịt thăn bò Úc', 'Hành tây caramen', 'Sốt tiêu đen thơm nồng').
- Gán đúng icon từ danh sách: food-drumstick, fruit-cherries, food-apple, fish, leaf, food-steak, seed, shaker, bottle-tonic, fruit-citrus, egg.

3. ĐÁNH DẤU VỊ TRÍ CHÍNH XÁC (pins):
- Tạo từ 2 đến 5 ghim (pins) đánh dấu đúng vào các thành phần ẩm thực đặc trưng trên ảnh.
- Toạ độ top (15 - 80) và left (15 - 80) là toạ độ phần trăm trên ảnh.
- Nhãn text ngắn gọn, chuyên nghiệp (ví dụ: 'Sashimi cá hồi phi lê', 'Sushi cuộn trứng tôm', 'Thăn bò áp chảo').

4. CÔNG THỨC GỢI Ý ĐẦU BẾP (suggestedRecipe):
- title: Tên món ăn gợi ý hấp dẫn, chuẩn vị nhà hàng.
- desc: Mô tả sâu sắc, súc tích (100 - 350 ký tự) gồm cảm nhận tầng vị (béo bùi, giòn thanh...) và bí quyết độc quyền của đầu bếp (kỹ thuật lửa, nhiệt độ, cách ướp hoặc nước chấm đi kèm).
- calories: Ước tính calo thực tế cho 1 khẩu phần (ví dụ 350 - 650 kcal).
- durationMinutes: Thời gian thực hiện hợp lý (ví dụ 20 - 45 phút).
- matchPercent: Độ tương thích nguyên liệu (88 - 98%).

Quy tắc bắt buộc:
- source chỉ dùng: 'visible' hoặc 'inferred'.
- icon chỉ dùng 1 trong: food-drumstick, fruit-cherries, food-apple, fish, leaf, food-steak, seed, shaker, bottle-tonic, fruit-citrus, egg.
- pins: top và left là số từ 0 đến 100.
- Nếu bức ảnh hoàn toàn không có thực phẩm: {"isFood": false, "title": "Không xác định", "accuracy": 0, "dishes": [], "ingredients": [], "pins": [], "suggestedRecipe": {"title": "", "desc": "", "calories": 0, "durationMinutes": 0, "matchPercent": 0}}.`,
          },
        });

        let text = response.text?.trim() || "{}";
        if (text.startsWith("```json")) {
          text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (text.startsWith("```")) {
          text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        raw = JSON.parse(text);
        if (raw) break;
      } catch (error: unknown) {
        lastError = error;
        console.warn(`[FoodVision] Model ${modelName} failed, trying next candidate if available...`);
      }
    }

    if (!raw) {
      const status = typeof lastError === "object" && lastError !== null && "status" in lastError ? (lastError as any).status : undefined;
      console.warn("[FoodVision] Scan failed on all candidate models", { status, error: lastError });
      throw new AppError("AI chưa phân tích được ảnh lúc này. Vui lòng thử lại với ảnh rõ nét hơn.", 503);
    }

    if (typeof raw === "object" && raw !== null && "isFood" in raw && (raw as any).isFood === false) {
      throw new AppError("Chưa nhận diện được thực phẩm. Hãy chụp rõ món ăn hoặc nguyên liệu, đủ sáng và gần hơn.", 422);
    }

    // Tiền xử lý dữ liệu để chống lỗi validate trên các trường phụ (icon, pins, confidence, title...)
    const sanitized = sanitizeVisionResult(raw);

    let parsed = resultSchema.validate(sanitized, { stripUnknown: true });
    if (parsed.error) {
      console.warn("[FoodVision] Invalid result schema, attempting recovery", {
        fields: parsed.error.details.map((detail) => detail.path.join(".")),
      });

      // Nếu lỗi do pins hoặc dishes, làm sạch dữ liệu phụ và thử lại để tránh trả 502 vô lý cho người dùng
      sanitized.pins = [];
      if (!Array.isArray(sanitized.dishes) || !sanitized.dishes.length) {
        sanitized.dishes = [{ name: sanitized.title || "Món ăn", confidence: "85%" }];
      }
      parsed = resultSchema.validate(sanitized, { stripUnknown: true });
    }

    if (parsed.error) {
      console.warn("[FoodVision] Unrecoverable result schema error", {
        fields: parsed.error.details.map((detail) => detail.path.join(".")),
      });
      throw new AppError("Kết quả phân tích chưa hợp lệ. Hãy thử ảnh rõ hơn.", 502);
    }

    const result = parsed.value as FoodPhotoAnalysis;
    if (!result.isFood || !result.ingredients.length) {
      throw new AppError("Chưa nhận diện được thực phẩm. Hãy chụp rõ món ăn hoặc nguyên liệu, đủ sáng và gần hơn.", 422);
    }

    return result;
  },
};
