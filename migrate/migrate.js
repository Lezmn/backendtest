require('dotenv').config();
const mysql = require('mysql2/promise');

const createTables = async (retries = 0) => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT || 3306),
    });

    try {
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

      await conn.query(`
        CREATE TABLE IF NOT EXISTS token_blacklist (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          token VARCHAR(1024) NOT NULL UNIQUE,
          expires_at DATETIME NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_token_blacklist_expires_at (expires_at)
        )
      `);
      console.log('✓ Table token_blacklist created or already exists');

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
