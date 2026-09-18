/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Recipe Category Management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "6507a1b2c3d4e5f6a7b8c9d1"
 *         code:
 *           type: string
 *           example: "family"
 *         name:
 *           type: string
 *           example: "Gia đình"
 *         icon:
 *           type: string
 *           example: "people-outline"
 *         order:
 *           type: number
 *           example: 1
 *         isActive:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all recipe categories (sorted by order)
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *         description: If true, returns all categories including inactive ones (admin)
 *     responses:
 *       200:
 *         description: List of categories retrieved
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
 *                     $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /categories/{code}:
 *   get:
 *     summary: Get category by code
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         example: "family"
 *     responses:
 *       200:
 *         description: Category found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 */
export {};
