/**
 * authService.test.js — Unit Tests (Jest + manual mocks)
 * ────────────────────────────────────────────────────────
 * ไม่ต่อ DB จริง — mock db, bcrypt, jwt ทั้งหมด
 */

jest.mock('../src/config/db');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const db      = require('../src/config/db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const AppError = require('../src/utils/AppError');

// โหลด service หลัง mock
const authService = require('../src/services/authService');

// ─── helpers ────────────────────────────────────────────
const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  password: '$2a$10$hashedpassword',
  role: 'user',
  is_active: 1,
  refresh_token: 'valid-refresh-token',
  created_at: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

// ════════════════════════════════════════════════════════
//  register()
// ════════════════════════════════════════════════════════
describe('authService.register()', () => {

  test('TC-01 | ✅ สมัครสมาชิกสำเร็จ — คืน id, name, email', async () => {
    db.query
      .mockResolvedValueOnce([[]])                          // SELECT email → ไม่ซ้ำ
      .mockResolvedValueOnce([{ insertId: 99 }]);           // INSERT

    bcrypt.hash.mockResolvedValue('$hashed');

    const result = await authService.register({
      name: 'New User',
      email: 'new@example.com',
      password: 'Pass1234',
    });

    expect(result).toEqual({ id: 99, name: 'New User', email: 'new@example.com' });
    expect(bcrypt.hash).toHaveBeenCalledWith('Pass1234', 10);
  });

  test('TC-02 | ❌ Email ซ้ำ — โยน AppError 409', async () => {
    db.query.mockResolvedValueOnce([[{ id: 1 }]]);          // SELECT email → พบแล้ว

    await expect(
      authService.register({ name: 'X', email: 'dup@example.com', password: 'Pass1234' })
    ).rejects.toMatchObject({
      status: 409,
      message: expect.stringMatching(/already exists/i),
    });
  });

});

// ════════════════════════════════════════════════════════
//  login()
// ════════════════════════════════════════════════════════
describe('authService.login()', () => {

  test('TC-03 | ✅ Login สำเร็จ — คืน token และ refreshToken', async () => {
    db.query
      .mockResolvedValueOnce([[mockUser]])                  // SELECT user
      .mockResolvedValueOnce([{}]);                         // UPDATE refresh_token

    bcrypt.compare.mockResolvedValue(true);
    jwt.sign
      .mockReturnValueOnce('access-token-xxx')
      .mockReturnValueOnce('refresh-token-xxx');

    const result = await authService.login({ email: mockUser.email, password: 'Pass1234' });

    expect(result).toEqual({ token: 'access-token-xxx', refreshToken: 'refresh-token-xxx' });
    expect(bcrypt.compare).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalledTimes(2);
  });

  test('TC-04 | ❌ Email ไม่มีในระบบ — โยน AppError 401', async () => {
    db.query.mockResolvedValueOnce([[]]);                   // SELECT → ว่าง

    await expect(
      authService.login({ email: 'ghost@x.com', password: 'Pass1234' })
    ).rejects.toMatchObject({ status: 401 });
  });

  test('TC-05 | ❌ Password ผิด — โยน AppError 401', async () => {
    db.query.mockResolvedValueOnce([[mockUser]]);
    bcrypt.compare.mockResolvedValue(false);                // password ไม่ตรง

    await expect(
      authService.login({ email: mockUser.email, password: 'WrongPass' })
    ).rejects.toMatchObject({ status: 401 });
  });

});

// ════════════════════════════════════════════════════════
//  refreshAccessToken()
// ════════════════════════════════════════════════════════
describe('authService.refreshAccessToken()', () => {

  test('TC-06 | ✅ Refresh token ถูกต้อง — คืน access token ใหม่', async () => {
    jwt.verify.mockReturnValue({ id: 1 });
    db.query.mockResolvedValueOnce([[{
      ...mockUser,
      refresh_token: 'valid-refresh-token',
      is_active: 1,
    }]]);
    jwt.sign.mockReturnValue('new-access-token');

    const result = await authService.refreshAccessToken('valid-refresh-token');
    expect(result).toEqual({ token: 'new-access-token' });
  });

  test('TC-07 | ❌ Refresh token หมดอายุ / ไม่ถูกต้อง — โยน AppError 401', async () => {
    jwt.verify.mockImplementation(() => { throw new Error('jwt expired'); });

    await expect(
      authService.refreshAccessToken('expired-token')
    ).rejects.toMatchObject({ status: 401 });
  });

  test('TC-08 | ❌ Refresh token ไม่ตรงกับในฐานข้อมูล — โยน AppError 401', async () => {
    jwt.verify.mockReturnValue({ id: 1 });
    db.query.mockResolvedValueOnce([[{ ...mockUser, refresh_token: 'other-token' }]]);

    await expect(
      authService.refreshAccessToken('valid-refresh-token')
    ).rejects.toMatchObject({ status: 401 });
  });

});

// ════════════════════════════════════════════════════════
//  logout()
// ════════════════════════════════════════════════════════
describe('authService.logout()', () => {

  test('TC-09 | ✅ Logout — token ถูก insert เข้า blacklist', async () => {
    const exp = Math.floor(Date.now() / 1000) + 900;       // หมดใน 15 นาที
    jwt.verify.mockReturnValue({ id: 1, exp });

    // ensureBlacklistTable (CREATE), INSERT, DELETE expired, UPDATE refresh_token
    db.query
      .mockResolvedValueOnce([{}])   // CREATE TABLE IF NOT EXISTS
      .mockResolvedValueOnce([{}])   // INSERT blacklist
      .mockResolvedValueOnce([{}])   // DELETE expired
      .mockResolvedValueOnce([{}]);  // UPDATE refresh_token = NULL

    await expect(authService.logout('some-valid-token')).resolves.not.toThrow();

    // ตรวจว่า INSERT blacklist ถูกเรียก
    const insertCall = db.query.mock.calls.find(
      ([sql]) => sql.includes('INSERT INTO token_blacklist')
    );
    expect(insertCall).toBeDefined();
    expect(insertCall[1][0]).toBe('some-valid-token');
  });

});

// ════════════════════════════════════════════════════════
//  isBlacklisted()
// ════════════════════════════════════════════════════════
describe('authService.isBlacklisted()', () => {

  test('TC-10 | ✅ Token อยู่ใน blacklist — คืน true', async () => {
    db.query
      .mockResolvedValueOnce([{}])          // DELETE expired
      .mockResolvedValueOnce([[{ 1: 1 }]]); // SELECT → พบ

    const result = await authService.isBlacklisted('blacklisted-token');
    expect(result).toBe(true);
  });

  test('TC-11 | ✅ Token ไม่อยู่ใน blacklist — คืน false', async () => {
    db.query
      .mockResolvedValueOnce([{}])   // DELETE expired
      .mockResolvedValueOnce([[]]); // SELECT → ไม่พบ

    const result = await authService.isBlacklisted('clean-token');
    expect(result).toBe(false);
  });

});

// ════════════════════════════════════════════════════════
//  getMe()
// ════════════════════════════════════════════════════════
describe('authService.getMe()', () => {

  test('TC-12 | ✅ พบ user — คืนข้อมูล (ไม่มี password)', async () => {
    const { password, ...safe } = mockUser;
    db.query.mockResolvedValueOnce([[safe]]);

    const result = await authService.getMe(1);
    expect(result).toMatchObject({ id: 1, email: mockUser.email });
    expect(result).not.toHaveProperty('password');
  });

  test('TC-13 | ❌ ไม่พบ user — โยน AppError 404', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await expect(authService.getMe(9999)).rejects.toMatchObject({ status: 404 });
  });

});

// ════════════════════════════════════════════════════════
//  isUserActive()
// ════════════════════════════════════════════════════════
describe('authService.isUserActive()', () => {

  test('TC-14 | ✅ User active → คืน true', async () => {
    db.query.mockResolvedValueOnce([[{ is_active: 1 }]]);
    expect(await authService.isUserActive(1)).toBe(true);
  });

  test('TC-15 | ✅ User inactive → คืน false', async () => {
    db.query.mockResolvedValueOnce([[{ is_active: 0 }]]);
    expect(await authService.isUserActive(1)).toBe(false);
  });

  test('TC-16 | ✅ ไม่พบ user → คืน false', async () => {
    db.query.mockResolvedValueOnce([[]]);
    expect(await authService.isUserActive(9999)).toBe(false);
  });

});
