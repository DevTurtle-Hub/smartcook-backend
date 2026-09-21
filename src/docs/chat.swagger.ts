/**
 * @swagger
 * tags:
 *   name: Realtime Chat
 *   description: Socket.io realtime chat gateway, 1-1 direct messaging, and community chat rooms
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatRoom:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "6507a1b2c3d4e5f6a7b8c9d0"
 *         roomCode:
 *           type: string
 *           example: "room-quick-tips"
 *         title:
 *           type: string
 *           example: "Góc Chia Sẻ Mẹo Nấu Nhanh"
 *         description:
 *           type: string
 *           example: "Bí kíp chế biến món ăn nhanh dưới 20p, mẹo vặt bảo quản thực phẩm."
 *         iconName:
 *           type: string
 *           example: "flash"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["#MonNhanh", "#MeoVat"]
 *         activeMembers:
 *           type: number
 *           example: 128
 *         lastMessage:
 *           type: string
 *           example: "Mẹo ướp thịt bò với chút dầu mè và bột bắp giúp bò mềm tan..."
 *         lastMessageTime:
 *           type: string
 *           example: "5 phút trước"
 *     DirectConversation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Target user ID
 *           example: "6507a1b2c3d4e5f6a7b8c9d1"
 *         conversationId:
 *           type: string
 *           example: "6507a1b2c3d4e5f6a7b8c9d5"
 *         user:
 *           $ref: '#/components/schemas/CommunityAuthor'
 *         lastMessage:
 *           type: string
 *           example: "Cá hồi áp chảo mặt da 3 phút lửa vừa là giòn rụm nha!"
 *         lastMessageTime:
 *           type: string
 *           example: "15 phút trước"
 *         unreadCount:
 *           type: number
 *           example: 0
 *         isOnline:
 *           type: boolean
 *           example: true
 *     ChatMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "6507a1b2c3d4e5f6a7b8c9e8"
 *         conversationId:
 *           type: string
 *           example: "6507a1b2c3d4e5f6a7b8c9d5"
 *         sender:
 *           $ref: '#/components/schemas/CommunityAuthor'
 *         text:
 *           type: string
 *           example: "Chào bạn, cho mình hỏi tỉ lệ pha sốt Teriyaki chuẩn với ạ?"
 *         imageUri:
 *           type: string
 *           example: null
 *         timestamp:
 *           type: string
 *           example: "14:35"
 *         isMe:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /api/v1/chat/rooms:
 *   get:
 *     summary: Get all public community chat rooms
 *     tags: [Realtime Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chat rooms
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
 *                     $ref: '#/components/schemas/ChatRoom'
 */

/**
 * @swagger
 * /api/v1/chat/conversations:
 *   get:
 *     summary: Get current user's direct conversations
 *     tags: [Realtime Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of direct conversations
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
 *                     $ref: '#/components/schemas/DirectConversation'
 */

/**
 * @swagger
 * /api/v1/chat/direct:
 *   post:
 *     summary: Start or retrieve 1-1 direct conversation with target user
 *     tags: [Realtime Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetUserId
 *             properties:
 *               targetUserId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Conversation retrieved or created
 */

/**
 * @swagger
 * /api/v1/chat/conversations/{id}/messages:
 *   get:
 *     summary: Get message history of a conversation or room
 *     tags: [Realtime Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Message list
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
 *                     $ref: '#/components/schemas/ChatMessage'
 *   post:
 *     summary: Send message via REST fallback
 *     tags: [Realtime Chat]
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
 *             properties:
 *               text:
 *                 type: string
 *               imageUri:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 */
