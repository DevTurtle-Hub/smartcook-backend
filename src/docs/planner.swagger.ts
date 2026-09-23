/**
 * @swagger
 * tags:
 *   name: Planner & Shopping
 *   description: API Quản lý Kế hoạch Bữa ăn (Meal Planner) & Danh mục Đi chợ Thông minh (Tự động trừ đồ trong tủ lạnh)
 */

/**
 * @swagger
 * /planner/current-week:
 *   get:
 *     summary: Lấy thực đơn 7 ngày của tuần (kèm tổng calo từng ngày)
 *     tags: [Planner & Shopping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: weekDate
 *         schema:
 *           type: string
 *         description: Ngày bất kỳ trong tuần cần xem (định dạng YYYY-MM-DD, mặc định tuần hiện tại)
 *     responses:
 *       200:
 *         description: Trả về thực đơn tuần chi tiết 7 ngày
 */

/**
 * @swagger
 * /planner/meals:
 *   put:
 *     summary: Thêm hoặc cập nhật món ăn vào một slot bữa ăn trong tuần
 *     tags: [Planner & Shopping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dayOfWeek, slot]
 *             properties:
 *               weekDate:
 *                 type: string
 *                 example: "2026-09-21"
 *               dayOfWeek:
 *                 type: string
 *                 enum: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"]
 *                 example: "Thứ 2"
 *               slot:
 *                 type: string
 *                 enum: ["Bữa Sáng", "Bữa Trưa", "Bữa Tối", "Bữa Phụ"]
 *                 example: "Bữa Trưa"
 *               time:
 *                 type: string
 *                 example: "12:00"
 *               recipeId:
 *                 type: string
 *                 example: "650000000000000000000001"
 *               customTitle:
 *                 type: string
 *                 example: "Cơm Gà Xào Nấm"
 *               calories:
 *                 type: number
 *                 example: 520
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xoá một món ăn khỏi slot bữa ăn trong ngày
 *     tags: [Planner & Shopping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dayOfWeek
 *         required: true
 *         schema:
 *           type: string
 *           example: "Thứ 2"
 *       - in: query
 *         name: slot
 *         required: true
 *         schema:
 *           type: string
 *           example: "Bữa Trưa"
 *       - in: query
 *         name: weekDate
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xoá thành công
 */

/**
 * @swagger
 * /planner/shopping-list:
 *   get:
 *     summary: Tự động sinh danh mục đi chợ thông minh (loại trừ nguyên liệu sẵn có trong tủ lạnh)
 *     tags: [Planner & Shopping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: weekDate
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách nguyên liệu cần mua kèm ước tính chi phí và số lượng đã loại trừ từ tủ lạnh
 *   post:
 *     summary: Thêm thủ công một món cần mua vào giỏ hàng
 *     tags: [Planner & Shopping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Măng tây tươi"
 *               amount:
 *                 type: string
 *                 example: "200g"
 *               price:
 *                 type: number
 *                 example: 25000
 *               category:
 *                 type: string
 *                 example: "Rau củ"
 *               recipeTitle:
 *                 type: string
 *                 example: "Bò Bít Tết Sốt Tiêu"
 *     responses:
 *       201:
 *         description: Thêm thành công
 */

/**
 * @swagger
 * /planner/shopping-list/{id}/bought:
 *   patch:
 *     summary: Đánh dấu nguyên liệu đã mua hoặc chưa mua (checkbox toggle)
 *     tags: [Planner & Shopping]
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
 *             required: [bought]
 *             properties:
 *               bought:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */

/**
 * @swagger
 * /planner/shopping-list/clear-bought:
 *   delete:
 *     summary: Dọn dẹp tất cả các món đã mua xong khỏi giỏ hàng
 *     tags: [Planner & Shopping]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dọn dẹp thành công
 */

/**
 * @swagger
 * /planner/sync-to-fridge:
 *   post:
 *     summary: 1-Click Đồng bộ tất cả nguyên liệu đã mua vào kho Tủ Lạnh (UserFridge)
 *     tags: [Planner & Shopping]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đồng bộ thành công, tự động nạp các món đã mua vào tủ lạnh
 */
