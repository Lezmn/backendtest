const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin, validateRefresh } = require('../middlewares/validate');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication API
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: สมัครสมาชิก
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: สมัครสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *       409:
 *         description: Email ซ้ำ
 */
router.post('/register', validateRegister, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: เข้าสู่ระบบ
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
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จ
 *       401:
 *         description: Email หรือ Password ผิด
 */
router.post('/login', validateLogin, authController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: ต่ออายุ Access Token
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
 *                 example: your-refresh-token
 *     responses:
 *       200:
 *         description: ต่ออายุ Access Token สำเร็จ
 *       401:
 *         description: Refresh Token ไม่ถูกต้องหรือหมดอายุ
 */
router.post('/refresh', validateRefresh, authController.refresh);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: ดูข้อมูลผู้ใช้ของตัวเอง
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ดึงข้อมูลตัวเองสำเร็จ
 *       401:
 *         description: ไม่ได้ส่ง token หรือ token ไม่ถูกต้อง
 */
router.get('/me', protect, authController.getMe);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: ออกจากระบบ
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ออกจากระบบสำเร็จ
 *       401:
 *         description: ไม่ได้ส่ง token หรือ token ไม่ถูกต้อง
 */
router.post('/logout', protect, authController.logout);

module.exports = router;