/**
 * userService.test.js — Unit Tests (Jest + manual mocks)
 * ────────────────────────────────────────────────────────
 * ไม่ต่อ DB จริง — mock db ทั้งหมด
 */

jest.mock('../src/config/db');

const db       = require('../src/config/db');
const AppError = require('../src/utils/AppError');
const userService = require('../src/services/userService');

// ─── shared fixture ─────────────────────────────────────
const mockUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  is_active: 1,
  created_at: '2025-01-01T00:00:00.000Z',
};

beforeEach(() => jest.clearAllMocks());

// ════════════════════════════════════════════════════════
//  getAll()
// ════════════════════════════════════════════════════════
describe('userService.getAll()', () => {

  test('TC-01 | ✅ ดึง users สำเร็จ พร้อม pagination', async () => {
    db.query
      .mockResolvedValueOnce([[mockUser, { ...mockUser, id: 2 }]])  // SELECT rows
      .mockResolvedValueOnce([[{ total: 20 }]]);                    // COUNT

    const result = await userService.getAll({ page: 1, limit: 2 });

    expect(result.rows).toHaveLength(2);
    expect(result.pagination).toMatchObject({
      currentPage:  1,
      totalPages:   10,   // 20 / 2
      totalItems:   20,
      itemsPerPage: 2,
    });
  });

  test('TC-02 | ✅ Pagination ถูกต้อง — page 2, limit 5', async () => {
    db.query
      .mockResolvedValueOnce([[]])               // rows (หน้า 2 อาจว่าง)
      .mockResolvedValueOnce([[{ total: 8 }]]); // COUNT

    const result = await userService.getAll({ page: 2, limit: 5 });

    expect(result.pagination.currentPage).toBe(2);
    expect(result.pagination.totalPages).toBe(2);    // ceil(8/5)
    expect(result.pagination.itemsPerPage).toBe(5);
  });

  test('TC-03 | ✅ Filter ด้วย role — ต้องส่ง query ที่มี AND role', async () => {
    db.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0 }]]);

    await userService.getAll({ role: 'admin' });

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/AND role = \?/);
    expect(params).toContain('admin');
  });

  test('TC-04 | ✅ SQL injection guard — sort ที่ไม่อนุญาตถูก fallback เป็น created_at', async () => {
    db.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0 }]]);

    await userService.getAll({ sort: 'DROP TABLE users; --' });

    const [sql] = db.query.mock.calls[0];
    expect(sql).toMatch(/ORDER BY created_at/);
  });

});

// ════════════════════════════════════════════════════════
//  getById()
// ════════════════════════════════════════════════════════
describe('userService.getById()', () => {

  test('TC-05 | ✅ พบ user — คืนข้อมูล', async () => {
    db.query.mockResolvedValueOnce([[mockUser]]);

    const result = await userService.getById(1);
    expect(result).toEqual(mockUser);
  });

  test('TC-06 | ❌ ไม่พบ user — โยน AppError 404', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await expect(userService.getById(9999)).rejects.toMatchObject({
      status:  404,
      message: 'User not found',
    });
  });

});

// ════════════════════════════════════════════════════════
//  update()
// ════════════════════════════════════════════════════════
describe('userService.update()', () => {

  test('TC-07 | ✅ อัปเดตข้อมูลสำเร็จ — คืน user ใหม่', async () => {
    const updated = { ...mockUser, name: 'Jane Doe', email: 'jane@example.com' };

    db.query
      .mockResolvedValueOnce([[mockUser]])  // getById ก่อน update
      .mockResolvedValueOnce([{}])          // UPDATE
      .mockResolvedValueOnce([[updated]]); // getById หลัง update

    const result = await userService.update(1, { name: 'Jane Doe', email: 'jane@example.com' });

    expect(result.name).toBe('Jane Doe');
    expect(result.email).toBe('jane@example.com');
  });

  test('TC-08 | ❌ อัปเดต user ที่ไม่มีอยู่ — โยน AppError 404', async () => {
    db.query.mockResolvedValueOnce([[]]);   // getById → ไม่พบ

    await expect(
      userService.update(9999, { name: 'X', email: 'x@x.com' })
    ).rejects.toMatchObject({ status: 404 });
  });

});

// ════════════════════════════════════════════════════════
//  remove()
// ════════════════════════════════════════════════════════
describe('userService.remove()', () => {

  test('TC-09 | ✅ ลบ user สำเร็จ — คืน user ที่ถูกลบ + message', async () => {
    db.query
      .mockResolvedValueOnce([[mockUser]])  // getById
      .mockResolvedValueOnce([[mockUser]])  // SELECT ก่อนลบ
      .mockResolvedValueOnce([{}]);         // DELETE

    const result = await userService.remove(1);

    expect(result).toMatchObject({ id: 1, message: 'User deleted successfully' });
  });

  test('TC-10 | ❌ ลบ user ที่ไม่มีอยู่ — โยน AppError 404', async () => {
    db.query.mockResolvedValueOnce([[]]);   // getById → ไม่พบ

    await expect(userService.remove(9999)).rejects.toMatchObject({ status: 404 });
  });

});

// ════════════════════════════════════════════════════════
//  updateStatus()
// ════════════════════════════════════════════════════════
describe('userService.updateStatus()', () => {

  test('TC-11 | ✅ ปิดการใช้งาน user (is_active = false)', async () => {
    const deactivated = { ...mockUser, is_active: 0 };

    db.query
      .mockResolvedValueOnce([[mockUser]])      // getById
      .mockResolvedValueOnce([{}])              // UPDATE is_active
      .mockResolvedValueOnce([[deactivated]]); // SELECT หลัง update

    const result = await userService.updateStatus(1, false);

    expect(result.is_active).toBe(0);
  });

  test('TC-12 | ✅ เปิดการใช้งาน user (is_active = true)', async () => {
    const activated = { ...mockUser, is_active: 1 };

    db.query
      .mockResolvedValueOnce([[mockUser]])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([[activated]]);

    const result = await userService.updateStatus(1, true);

    expect(result.is_active).toBe(1);
  });

  test('TC-13 | ❌ เปลี่ยนสถานะ user ที่ไม่มีอยู่ — โยน AppError 404', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await expect(userService.updateStatus(9999, true)).rejects.toMatchObject({
      status: 404,
    });
  });

});
