/**
 * @swagger
 * tags:
 *   name: Fridge
 *   description: Smart User Fridge & Pantry Management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FridgeItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "6507a1b2c3d4e5f6a7b8c9d3"
 *         name:
 *           type: string
 *           example: "Thịt gà"
 *         amount:
 *           type: string
 *           example: "500g"
 *         category:
 *           type: string
 *           example: "meat"
 *         storageLocation:
 *           type: string
 *           enum: [chilled, frozen, pantry]
 *           example: "chilled"
 *         expiryDate:
 *           type: string
 *           format: date-time
 *     UserFridge:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           example: "6507a1b2c3d4e5f6a7b8c9d0"
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FridgeItem'
 */

/**
 * @swagger
 * /fridge/my-fridge:
 *   get:
 *     summary: Get current user's fridge and pantry items
 *     tags: [Fridge]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fridge contents retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserFridge'
 */

/**
 * @swagger
 * /fridge/items:
 *   post:
 *     summary: Add an ingredient item to fridge
 *     tags: [Fridge]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Thịt gà"
 *               amount:
 *                 type: string
 *                 example: "500g"
 *               category:
 *                 type: string
 *                 example: "meat"
 *               storageLocation:
 *                 type: string
 *                 enum: [chilled, frozen, pantry]
 *                 example: "chilled"
 *     responses:
 *       201:
 *         description: Item added successfully
 */
export {};
