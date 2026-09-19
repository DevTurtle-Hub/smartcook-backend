/**
 * @swagger
 * tags:
 *   name: Cooking History
 *   description: Tracking cooked dishes, awarding Chef XP points (+50 XP) and rank leveling
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CookingHistoryItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "6507a1b2c3d4e5f6a7b8c9d8"
 *         userId:
 *           type: string
 *           example: "6507a1b2c3d4e5f6a7b8c9d0"
 *         recipeId:
 *           type: string
 *           example: "6507a1b2c3d4e5f6a7b8c9d4"
 *         recipeName:
 *           type: string
 *           example: "Gà xào sả ớt cay thơm"
 *         image:
 *           type: string
 *           example: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80"
 *         cookedAt:
 *           type: string
 *           format: date-time
 *         durationMinutes:
 *           type: number
 *           example: 25
 *         servings:
 *           type: number
 *           example: 3
 *         usedIngredients:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Ức gà", "Sả", "Ớt", "Tỏi", "Nước mắm"]
 *         calories:
 *           type: number
 *           example: 420
 *         rating:
 *           type: number
 *           example: 5
 *         xpEarned:
 *           type: number
 *           example: 50
 *     CookingCompletionResponse:
 *       type: object
 *       properties:
 *         historyItem:
 *           $ref: '#/components/schemas/CookingHistoryItem'
 *         xpEarned:
 *           type: number
 *           example: 50
 *         chefExp:
 *           type: number
 *           example: 450
 *         level:
 *           type: string
 *           example: "Đầu bếp tài ba"
 *         leveledUp:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /cooking-history:
 *   post:
 *     summary: Record a completed cooked dish, earn +50 Chef XP and check rank progression
 *     tags: [Cooking History]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipeId
 *               - recipeName
 *               - durationMinutes
 *             properties:
 *               recipeId:
 *                 type: string
 *                 example: "6507a1b2c3d4e5f6a7b8c9d4"
 *               recipeName:
 *                 type: string
 *                 example: "Gà xào sả ớt cay thơm"
 *               image:
 *                 type: string
 *                 example: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80"
 *               durationMinutes:
 *                 type: number
 *                 example: 25
 *               servings:
 *                 type: number
 *                 example: 3
 *               usedIngredients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Ức gà", "Sả", "Ớt", "Tỏi", "Nước mắm"]
 *               calories:
 *                 type: number
 *                 example: 420
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *     responses:
 *       201:
 *         description: Cooking recorded successfully and XP awarded
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
 *                   example: "Tuyệt vời! Bạn đã hoàn thành món ăn và nhận +50 XP!"
 *                 data:
 *                   $ref: '#/components/schemas/CookingCompletionResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Retrieve user's cooking history (sorted by latest first) with current Chef XP and Level
 *     tags: [Cooking History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated cooking history list with chef profile status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CookingHistoryItem'
 *                     total:
 *                       type: number
 *                       example: 5
 *                     page:
 *                       type: number
 *                       example: 1
 *                     totalPages:
 *                       type: number
 *                       example: 1
 *                     chefExp:
 *                       type: number
 *                       example: 450
 *                     level:
 *                       type: string
 *                       example: "Đầu bếp tài ba"
 */

/**
 * @swagger
 * /cooking-history/{id}:
 *   delete:
 *     summary: Delete a cooking history record
 *     tags: [Cooking History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cooking history record deleted successfully
 *       403:
 *         description: Forbidden - cannot delete another user's record
 *       404:
 *         description: Record not found
 */
export {};
