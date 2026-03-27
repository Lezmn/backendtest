const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { validateUpdateUser,validateUpdateUserStatus} = require('../middlewares/validate');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management API
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: ดึงข้อมูล Users ทั้งหมด
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: สำเร็จ
 *       401:
 *         description: Unauthorized
 */
router.get('/', protect,authorize('admin'),userController.getAll);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: ดึงข้อมูล User ตาม ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: สำเร็จ
 *       404:
 *         description: ไม่พบ User
 */
router.get('/:id', protect, authorize('admin', 'user'), userController.getById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: อัปเดต User
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: อัปเดตสำเร็จ
 */
router.put('/:id', protect, authorize('admin', 'user'), validateUpdateUser, userController.update);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: เปิด/ปิดการใช้งาน Account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: อัปเดตสถานะสำเร็จ
 *       403:
 *         description: Admin เท่านั้น
 *       404:
 *         description: ไม่พบ User
 */
router.patch( '/:id/status',protect,authorize('admin'),validateUpdateUserStatus,userController.updateStatus);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: ลบ User
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: ลบสำเร็จ
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', protect, authorize('admin'), userController.remove);

module.exports = router;