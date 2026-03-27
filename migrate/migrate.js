require('dotenv').config();
const mysql = require('mysql2/promise');

const createTables = async (retries = 0) => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT || 3306),
    });

    try {
      // สร้างฐานข้อมูล
      await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
      console.log(`✓ Database ${process.env.DB_NAME} created or already exists`);

      // เลือกฐานข้อมูล
      await conn.query(`USE ${process.env.DB_NAME}`);

      // สร้างตาราง users ให้ตรงกับ schema ที่มีอยู่
      await conn.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('user', 'admin') DEFAULT 'user',
          is_active TINYINT(1) DEFAULT 1,
          refresh_token VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Table users created or already exists');

      console.log('\n✅ Migration completed successfully!');
    } finally {
      await conn.end();
    }
  } catch (error) {
    if ((error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') && retries < 3) {
      console.log(`⏳ MySQL not ready, retrying in 5 seconds... (${retries + 1}/3)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return createTables(retries + 1);
    }
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

createTables();
