/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication, Authorization & User Profile Management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserPreferences:
 *       type: object
 *       properties:
 *         hasCompletedSurvey:
 *           type: boolean
 *           example: true
 *         portion:
 *           type: string
 *           enum: ["1", "2", "3-4", "5+"]
 *           example: "3-4"
 *         cuisines:
 *           type: array
 *           items:
 *             type: string
 *           example: ["vietnamese", "healthy"]
 *         healthGoal:
 *           type: string
 *           enum: ["healthy", "loss", "muscle", "budget"]
 *           example: "healthy"
 *         restrictions:
 *           type: array
 *           items:
 *             type: string
 *           example: ["no-spicy"]
 *         tasteProfile:
 *           type: array
 *           items:
 *             type: string
 *           example: ["dam-da"]
 *         cookingTime:
 *           type: string
 *           enum: ["quick", "medium", "standard", "slow"]
 *           example: "medium"
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "6507a1b2c3d4e5f6a7b8c9d0"
 *         email:
 *           type: string
 *           example: "user@smartcook.vn"
 *         firstName:
 *           type: string
 *           example: "Van Loi"
 *         lastName:
 *           type: string
 *           example: "Dinh"
 *         fullName:
 *           type: string
 *           example: "Van Loi Dinh"
 *         avatar:
 *           type: string
 *           example: ""
 *         role:
 *           type: string
 *           example: "user"
 *         chefExp:
 *           type: number
 *           example: 50
 *         level:
 *           type: string
 *           example: "Tập sự"
 *         preferences:
 *           $ref: '#/components/schemas/UserPreferences'
 *     AuthTokens:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         refreshToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         expiresIn:
 *           type: string
 *           example: "1d"
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Van Loi
 *               lastName:
 *                 type: string
 *                 example: Dinh
 *               email:
 *                 type: string
 *                 example: user@smartcook.vn
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       201:
 *         description: Account registered successfully
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
 *                   example: Account registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserResponse'
 *                     tokens:
 *                       $ref: '#/components/schemas/AuthTokens'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already in use
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in to account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@smartcook.vn
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserResponse'
 *                     tokens:
 *                       $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: Invalid email or password
 */

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh JWT Access Token using Refresh Token (Rotation Protected)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                   example: Tokens refreshed successfully
 *                 data:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: Invalid or expired refresh token
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out current user session and revoke refresh token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged-in user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update profile information (First Name, Last Name, Avatar)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Van Loi
 *               lastName:
 *                 type: string
 *                 example: Dinh
 *               avatar:
 *                 type: string
 *                 example: "https://res.cloudinary.com/demo/image/upload/sample.jpg"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /auth/survey:
 *   post:
 *     summary: Save onboarding survey taste and dietary preferences
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               portion:
 *                 type: string
 *                 enum: ["1", "2", "3-4", "5+"]
 *                 example: "3-4"
 *               cuisines:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["vietnamese", "healthy"]
 *               healthGoal:
 *                 type: string
 *                 enum: ["healthy", "loss", "muscle", "budget"]
 *                 example: "healthy"
 *               restrictions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["no-spicy"]
 *               tasteProfile:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["dam-da"]
 *               cookingTime:
 *                 type: string
 *                 enum: ["quick", "medium", "standard", "slow"]
 *                 example: "medium"
 *     responses:
 *       200:
 *         description: Survey preferences saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserPreferences'
 *       401:
 *         description: Unauthorized
 */
export {};
