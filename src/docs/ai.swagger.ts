/**
 * @swagger
 * tags:
 *   name: AI Services
 *   description: Gemini AI food vision scanning, pin overlays, scan history, and draggable chef assistant chat
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ScanDetectedIngredient:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Thịt ức gà"
 *         confidence:
 *           type: string
 *           example: "98%"
 *         icon:
 *           type: string
 *           example: "food-drumstick"
 *     ScanPin:
 *       type: object
 *       properties:
 *         text:
 *           type: string
 *           example: "🍗 Ức gà (98%)"
 *         top:
 *           type: number
 *           example: 30
 *         bottom:
 *           type: number
 *           example: null
 *         left:
 *           type: number
 *           example: 25
 *         right:
 *           type: number
 *           example: null
 *     ScanSuggestedRecipe:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "6507a1b2c3d4e5f6a7b8c9d4"
 *         title:
 *           type: string
 *           example: "Salad Ức Gà Bơ Sáp Healthy"
 *         desc:
 *           type: string
 *           example: "Công thức sáng tạo tối ưu từ 100% nguyên liệu vừa quét được."
 *         calories:
 *           type: number
 *           example: 380
 *         durationMinutes:
 *           type: number
 *           example: 20
 *         matchPercent:
 *           type: number
 *           example: 95
 *     ScanHistoryItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "6507a1b2c3d4e5f6a7b8c9d9"
 *         title:
 *           type: string
 *           example: "Ngăn mát tủ lạnh sáng nay"
 *         imageUrl:
 *           type: string
 *           example: "https://res.cloudinary.com/ynikavd2/image/upload/smartcook/scans/sample.jpg"
 *         image:
 *           type: string
 *           example: "https://res.cloudinary.com/ynikavd2/image/upload/smartcook/scans/sample.jpg"
 *         accuracy:
 *           type: number
 *           example: 96
 *         scannedAt:
 *           type: string
 *           example: "Hôm nay, 12:30"
 *         ingredients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ScanDetectedIngredient'
 *         pins:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ScanPin'
 *         suggestedRecipe:
 *           $ref: '#/components/schemas/ScanSuggestedRecipe'
 *     AssistantChatRequest:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           example: "Hôm nay trong tủ lạnh có ức gà và cà chua, mình nên nấu món gì nhanh?"
 *         conversationHistory:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               sender:
 *                 type: string
 *                 enum: [user, ai]
 *               text:
 *                 type: string
 *     AssistantChatResponse:
 *       type: object
 *       properties:
 *         replyText:
 *           type: string
 *           example: "Với thịt ức gà và cà chua bi trong tủ lạnh, SmartCook gợi ý bạn làm món **Salad Ức Gà Áp Chảo Sốt Chanh Leo** hoặc **Ức Gà Sốt Cà Chua Phô Mai** chỉ mất 15 phút nhé!"
 *         suggestedDishes:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Salad Ức Gà Bơ Sáp", "Ức gà sốt cà chua"]
 *         quickPrompts:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Cách ướp ức gà mềm", "Món dưới 20 phút"]
 */

/**
 * @swagger
 * /api/v1/ai/scan-ingredients:
 *   post:
 *     summary: Scan food image for detected ingredients, coordinate pins, and suggested recipe
 *     tags: [AI Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Food photo captured from mobile camera or gallery
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageBase64:
 *                 type: string
 *                 description: Base64 data string of the image
 *               imageUrl:
 *                 type: string
 *                 description: Direct URL of the image to scan
 *     responses:
 *       201:
 *         description: Scan and analysis successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Quét và phân tích thực phẩm thành công"
 *                 data:
 *                   $ref: '#/components/schemas/ScanHistoryItem'
 *       400:
 *         description: Missing image
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/ai/scan-history:
 *   get:
 *     summary: Get user's AI scan history sorted by date descending
 *     tags: [AI Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of records to return
 *     responses:
 *       200:
 *         description: Scan history list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ScanHistoryItem'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/ai/scan-history/{id}:
 *   delete:
 *     summary: Delete a scan history record
 *     tags: [AI Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Scan history ID
 *     responses:
 *       200:
 *         description: Scan history deleted successfully
 *       403:
 *         description: Forbidden - Not the owner of this scan record
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/v1/ai/assistant-chat:
 *   post:
 *     summary: Chat with SmartCook AI Chef Assistant with fridge & user preferences context
 *     tags: [AI Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssistantChatRequest'
 *     responses:
 *       200:
 *         description: AI Chef response with replyText, clickable suggestedDishes, and quickPrompts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AssistantChatResponse'
 *       400:
 *         description: Missing or empty message
 *       401:
 *         description: Unauthorized
 */
