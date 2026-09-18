/**
 * @swagger
 * tags:
 *   name: Ingredients
 *   description: Master Ingredient Library (14 Groups)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Ingredient:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "6507a1b2c3d4e5f6a7b8c9d2"
 *         name:
 *           type: string
 *           example: "Thịt gà"
 *         normalizedName:
 *           type: string
 *           example: "thit ga"
 *         aliases:
 *           type: array
 *           items:
 *             type: string
 *           example: ["ga", "dui ga", "uc ga", "canh ga"]
 *         category:
 *           type: string
 *           enum: [meat, seafood, greens, veggies, herbs, fruits, egg_tofu, dairy, carbs, grain, seasoning, spice, sauces, dry]
 *           example: "meat"
 *         subCategory:
 *           type: string
 *           example: "Thịt gia cầm"
 *         defaultUnit:
 *           type: string
 *           example: "g"
 *         averagePrice:
 *           type: number
 *           example: 45000
 *         isActive:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /ingredients:
 *   get:
 *     summary: Search and filter master ingredients
 *     tags: [Ingredients]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword (matches name, normalized name or aliases)
 *         example: "thit"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [meat, seafood, greens, veggies, herbs, fruits, egg_tofu, dairy, carbs, grain, seasoning, spice, sauces, dry]
 *         description: Filter by ingredient category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Ingredients retrieved
 */

/**
 * @swagger
 * /ingredients/category/{category}:
 *   get:
 *     summary: Get all ingredients belonging to a specific category
 *     tags: [Ingredients]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         example: "meat"
 *     responses:
 *       200:
 *         description: List of ingredients in the specified category
 */
export {};
