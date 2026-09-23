/**
 * @swagger
 * tags:
 *   name: Stores & Supermarkets
 *   description: API Định vị Siêu thị Lân cận qua GPS (Toán tử MongoDB $geoNear & GeoJSON 2dsphere)
 */

/**
 * @swagger
 * /stores/nearby:
 *   get:
 *     summary: Tìm siêu thị gần nhất dựa theo toạ độ GPS của người dùng
 *     tags: [Stores & Supermarkets]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         example: 10.7769
 *         description: Vĩ độ (Latitude)
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         example: 106.6909
 *         description: Kinh độ (Longitude)
 *       - in: query
 *         name: radiusKm
 *         schema:
 *           type: number
 *           default: 20
 *         description: Bán kính tìm kiếm (km)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng kết quả tối đa
 *     responses:
 *       200:
 *         description: Danh sách siêu thị được sắp xếp từ gần đến xa kèm thời gian di chuyển (xe máy, đi bộ)
 */

/**
 * @swagger
 * /stores:
 *   get:
 *     summary: Lấy danh sách tất cả các siêu thị
 *     tags: [Stores & Supermarkets]
 *     responses:
 *       200:
 *         description: Danh sách tất cả siêu thị trong hệ thống
 *   post:
 *     summary: Thêm siêu thị mới (Chỉ dành cho Admin)
 *     tags: [Stores & Supermarkets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, brand, address, latitude, longitude]
 *             properties:
 *               name:
 *                 type: string
 *               brand:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               openHours:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo siêu thị mới thành công
 */

/**
 * @swagger
 * /stores/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một siêu thị theo ID
 *     tags: [Stores & Supermarkets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin chi tiết siêu thị
 */
