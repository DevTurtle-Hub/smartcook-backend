/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Phân vùng quản trị hệ thống và kiểm soát thành viên
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Lấy thống kê tổng quan hệ thống cho Admin Dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê KPI, biểu đồ tăng trưởng và top món ăn
 *       401:
 *         description: Chưa xác thực token
 *       403:
 *         description: Không có quyền quản trị viên (Admin)
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Lấy danh sách người dùng có phân trang, tìm kiếm và lọc
 *     tags: [Admin]
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
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên hoặc email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 */

/**
 * @swagger
 * /admin/users/{userId}/status:
 *   patch:
 *     summary: Khóa hoặc kích hoạt lại tài khoản thành viên
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 */

/**
 * @swagger
 * /admin/users/{userId}/role:
 *   patch:
 *     summary: Phân quyền quản trị viên hoặc giáng cấp về người dùng thường
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: admin
 *     responses:
 *       200:
 *         description: Phân quyền thành công
 */
