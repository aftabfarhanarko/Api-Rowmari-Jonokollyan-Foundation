const { Client } = require('pg');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Connected to PostgreSQL database.');

  // 1. Ensure SUPER_ADMIN role exists
  let roleRes = await client.query("SELECT id, name FROM roles WHERE name = 'SUPER_ADMIN'");
  let superAdminRoleId;
  if (roleRes.rows.length === 0) {
    const insertRole = await client.query(
      "INSERT INTO roles (name, description) VALUES ('SUPER_ADMIN', 'Super Administrator with complete privileges') RETURNING id;"
    );
    superAdminRoleId = insertRole.rows[0].id;
    console.log('✅ Created SUPER_ADMIN role:', superAdminRoleId);
  } else {
    superAdminRoleId = roleRes.rows[0].id;
    console.log('✅ Found SUPER_ADMIN role:', superAdminRoleId);
  }

  // 2. Define Super Admin details
  const adminEmail = 'admin@rjf.org';
  const adminPhone = '+8801700000001';
  const plainPassword = 'SuperAdmin@20266!';
  const fullName = 'সুপার অ্যাডমিন (Super Admin)';

  const passwordHash = await argon2.hash(plainPassword);

  // Check if user with this email or phone exists
  const existingUserRes = await client.query(
    'SELECT id, email, phone FROM users WHERE email = $1 OR phone = $2',
    [adminEmail, adminPhone]
  );

  let userId;
  if (existingUserRes.rows.length > 0) {
    userId = existingUserRes.rows[0].id;
    await client.query(
      `UPDATE users 
       SET full_name = $1, email = $2, phone = $3, password_hash = $4, status = 'ACTIVE', is_email_verified = true, is_phone_verified = true, updated_at = NOW()
       WHERE id = $5`,
      [fullName, adminEmail, adminPhone, passwordHash, userId]
    );
    console.log(`✅ Updated existing user (${userId}) to Super Admin.`);
  } else {
    const insertUserRes = await client.query(
      `INSERT INTO users (full_name, email, phone, password_hash, status, is_email_verified, is_phone_verified, district, upazila)
       VALUES ($1, $2, $3, $4, 'ACTIVE', true, true, 'Kurigram', 'Roumari')
       RETURNING id`,
      [fullName, adminEmail, adminPhone, passwordHash]
    );
    userId = insertUserRes.rows[0].id;
    console.log(`✅ Created new user (${userId}) as Super Admin.`);
  }

  // 3. Link SUPER_ADMIN role in user_roles
  await client.query(
    `INSERT INTO user_roles (user_id, role_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [userId, superAdminRoleId]
  );
  console.log('✅ Assigned SUPER_ADMIN role in user_roles.');

  // Also ensure admin@romonijon.org has a known password if it exists
  const romonijonUser = await client.query("SELECT id FROM users WHERE email = 'admin@romonijon.org'");
  if (romonijonUser.rows.length > 0) {
    await client.query(
      "UPDATE users SET password_hash = $1, status = 'ACTIVE' WHERE id = $2",
      [passwordHash, romonijonUser.rows[0].id]
    );
    console.log("✅ Also updated admin@romonijon.org password to 'SuperAdmin@2026!'");
  }

  // 4. Generate valid JWT Access Token and Refresh Token
  const accessSecret = process.env.JWT_ACCESS_SECRET || '3d261839907e04e4333aa500ee487beae1c87c124f2496d93eb7d7fcc7ea639c';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || '3c8471ad5baa2e028d63fde3be026ba4e32ce4d4a5bc023ad9be5a2eb6d623f9';

  const payload = {
    sub: userId,
    email: adminEmail,
    phone: adminPhone,
    roles: ['SUPER_ADMIN'],
  };

  // 7-day valid token for immediate ease of testing/use
  const accessToken = jwt.sign(payload, accessSecret, { expiresIn: '7d' });
  const refreshToken = jwt.sign({ sub: userId }, refreshSecret, { expiresIn: '30d' });

  console.log('\n=============================================');
  console.log('🎉 SUPER ADMIN ACCOUNT DETAILS & TOKENS:');
  console.log('=============================================');
  console.log('User ID:      ', userId);
  console.log('Full Name:    ', fullName);
  console.log('Email:        ', adminEmail);
  console.log('Phone:        ', adminPhone);
  console.log('Password:     ', plainPassword);
  console.log('Role:          SUPER_ADMIN');
  console.log('Status:        ACTIVE');
  console.log('---------------------------------------------');
  console.log('Access Token (Bearer):');
  console.log(accessToken);
  console.log('---------------------------------------------');
  console.log('Refresh Token:');
  console.log(refreshToken);
  console.log('=============================================\n');

  await client.end();
}

main().catch((err) => {
  console.error('❌ Error creating super admin:', err);
  process.exit(1);
});
