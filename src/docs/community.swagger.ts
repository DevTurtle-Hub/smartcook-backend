/**
 * @swagger
 * tags:
 *   name: Community
 *   description: Culinary social network, posts feed, multi-image upload, emoji reactions, and threaded comments
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CommunityAuthor:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "6507a1b2c3d4e5f6a7b8c9d0"
 *         name:
 *           type: string
 *           example: "Lan Anh Nguyễn"
 *         avatar:
 *           type: string
 *           example: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80"
 *         badge:
 *           type: string
 *           example: "Master Chef"
 *         isChef:
 *           type: boolean
 *           example: true
 *     PostImage:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           example: "https://res.cloudinary.com/ynikavd2/image/upload/smartcook/community/dish.jpg"
 *         publicId:
 *           type: string
 *           example: "smartcook/community/dish"
 *     CommunityComment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "6507a1b2c3d4e5f6a7b8c9e1"
 *         postId:
 *           type: string
 *           example: "6507a1b2c3d4e5f6a7b8c9d4"
 *         author:
 *           $ref: '#/components/schemas/CommunityAuthor'
 *         content:
 *           type: string
 *           example: "Nhìn hấp dẫn quá bạn ơi, sốt chanh leo này có cần thêm mật ong không?"
 *         likesCount:
 *           type: number
 *           example: 3
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CommunityPost:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "6507a1b2c3d4e5f6a7b8c9d4"
 *         dishName:
 *           type: string
 *           example: "Salad Ức Gà Bơ Sáp Eat Clean"
 *         caption:
 *           type: string
 *           example: "Bữa trưa healthy nhẹ nhàng đầy đủ protein từ ức gà và chất béo tốt từ quả bơ sáp Đắk Lắk! #EatClean #Healthy"
 *         content:
 *           type: string
 *           example: "Bữa trưa healthy nhẹ nhàng đầy đủ protein từ ức gà và chất béo tốt từ quả bơ sáp Đắk Lắk! #EatClean #Healthy"
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PostImage'
 *         imageUrls:
 *           type: array
 *           items:
 *             type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["#EatClean", "#Healthy"]
 *         likesCount:
 *           type: number
 *           example: 42
 *         totalReactions:
 *           type: number
 *           example: 42
 *         isLiked:
 *           type: boolean
 *           example: true
 *         commentsCount:
 *           type: number
 *           example: 8
 *         author:
 *           $ref: '#/components/schemas/CommunityAuthor'
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/posts:
 *   get:
 *     summary: Get paginated community feed posts (Dual alias: /api/v1/community/posts)
 *     tags: [Community]
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
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by hashtag (e.g. #EatClean)
 *     responses:
 *       200:
 *         description: List of posts retrieved successfully
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
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CommunityPost'
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     totalPages:
 *                       type: number
 *   post:
 *     summary: Create a new post (+20 Chef XP)
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - caption
 *             properties:
 *               caption:
 *                 type: string
 *                 description: Post caption / description
 *               dishName:
 *                 type: string
 *                 description: Name of the dish
 *               tags:
 *                 type: string
 *                 description: Comma separated tags (e.g. #EatClean, #Healthy)
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Post created successfully
 */

/**
 * @swagger
 * /api/v1/posts/{id}/react:
 *   post:
 *     summary: React to a post (like, love, haha, wow, sad, angry)
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [like, love, haha, wow, sad, angry]
 *                 default: like
 *     responses:
 *       200:
 *         description: Reaction updated successfully
 */

/**
 * @swagger
 * /api/v1/posts/{id}/comments:
 *   get:
 *     summary: Get comments of a post
 *     tags: [Community]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comments list
 *   post:
 *     summary: Add a comment to a post (+5 XP)
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               parentCommentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 */
