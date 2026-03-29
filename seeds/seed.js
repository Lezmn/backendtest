require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const createAdminUser = async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
  });

  try {
    // ตรวจสอบว่า admin มีอยู่หรือไม่
    const [existing] = await conn.execute(
      'SELECT id FROM users WHERE email = ? AND role = ?',
      ['admin@example.com', 'admin']
    );

    if (existing.length) {
      console.log('✓ Admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    // สร้าง admin user
    await conn.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Admin', 'admin@example.com', hashedPassword, 'admin']
    );

    console.log('✅ Admin user created successfully!');
    console.log('   Email: admin@example.com');
    console.log('   Password: Admin@123');
    console.log('   ⚠️  Please change password after first login!');
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
};

createAdminUser();
