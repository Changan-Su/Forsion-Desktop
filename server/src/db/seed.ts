import bcrypt from 'bcrypt';
import pool from './connection.js';

async function createDefaultAdmin() {
  try {
    // 检查管理员是否已存在
    const [existingAdmins]: any = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      ['admin']
    );

    if (existingAdmins.length > 0) {
      console.log('ℹ️  Admin user already exists');
      return;
    }

    // 创建管理员账户
    const password = 'Admin123!@#';
    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)',
      ['admin', password_hash, 'admin@forsion.com', 'admin']
    );

    console.log('✅ Default admin user created:');
    console.log('   Username: admin');
    console.log('   Password: Admin123!@#');
    console.log('   ⚠️  Please change this password after first login!');

  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  createDefaultAdmin().then(() => process.exit(0));
}

export { createDefaultAdmin };

