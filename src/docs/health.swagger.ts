/**
 * @swagger
 * tags:
 *   name: System
 *   description: System health and runtime status
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Kiểm tra trạng thái hệ thống (Health Check)
 *     description: Trả về tình trạng hoạt động của backend, thời gian uptime và kết nối database MongoDB.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Hệ thống hoạt động bình thường
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
 *                   example: "SmartCook Backend is healthy and running"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "ok"
 *                     uptime:
 *                       type: number
 *                       example: 120.45
 *                     timestamp:
 *                       type: string
 *                       example: "2026-09-17T10:00:00.000Z"
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "connected"
 *                         name:
 *                           type: string
 *                           example: "smartcook_db"
 */
export {};
