import * as net from 'net';
if (typeof (net as any).setDefaultAutoSelectFamily === 'function') {
  (net as any).setDefaultAutoSelectFamily(false);
}

import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/access-control/entities/role.entity';
import { Permission } from '../../modules/access-control/entities/permission.entity';
import { UserStatus, RoleName, PERMISSION_KEYS } from '../../common/constants';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined in environment variables.');
  }

  const requiresSsl =
    process.env.NODE_ENV === 'production' ||
    databaseUrl.includes('sslmode=require') ||
    databaseUrl.includes('neon.tech');

  const dataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    entities: [path.join(__dirname, '/../../**/*.entity{.ts,.js}')],
    synchronize: false,
    ssl: requiresSsl ? { rejectUnauthorized: false } : false,
    extra: {
      max: 5,
      connectionTimeoutMillis: 15000,
    },
  });

  console.log('Connecting to database...');
  await dataSource.initialize();
  console.log('✅ Connected successfully!');

  const roleRepo = dataSource.getRepository(Role);
  const permRepo = dataSource.getRepository(Permission);
  const userRepo = dataSource.getRepository(User);

  // 1. Ensure SUPER_ADMIN role exists
  let superAdminRole = await roleRepo.findOne({ where: { name: RoleName.SUPER_ADMIN } });
  if (!superAdminRole) {
    console.log('Creating SUPER_ADMIN role...');
    const allPerms: Permission[] = [];
    for (const [_, key] of Object.entries(PERMISSION_KEYS)) {
      let perm = await permRepo.findOne({ where: { key } });
      if (!perm) {
        const [resource, action] = key.split('.');
        perm = permRepo.create({
          key,
          resource: resource || 'general',
          action: action || 'manage',
          description: `Permission to ${action} on ${resource}`,
        });
        perm = await permRepo.save(perm);
      }
      allPerms.push(perm);
    }

    superAdminRole = roleRepo.create({
      name: RoleName.SUPER_ADMIN,
      description: 'Super Administrator with complete privileges',
      permissions: allPerms,
    });
    superAdminRole = await roleRepo.save(superAdminRole);
    console.log('✅ SUPER_ADMIN role created with full permissions.');
  } else {
    console.log('✅ SUPER_ADMIN role already exists.');
  }

  // 2. Check all existing users
  const allUsers = await userRepo.find({ relations: ['roles'] });
  console.log(`\nFound ${allUsers.length} existing users in the database:`);
  for (const u of allUsers) {
    const roleNames = u.roles?.map(r => r.name).join(', ') || 'No Role';
    console.log(` - [${u.id.slice(0, 8)}] Email: ${u.email} | Phone: ${u.phone} | Name: ${u.fullName} | Roles: [${roleNames}] | Status: ${u.status}`);
  }

  // 3. Super Admin setup:
  // We will configure a dedicated superadmin account:
  // Email: admin@rkf.org
  // Phone: +8801700000001 (if not taken)
  // Password: SuperAdmin@2026!
  const targetEmail = 'admin@rkf.org';
  const targetPassword = 'SuperAdmin@2026!';
  const targetPhone = '+8801700000001';

  let adminUser = await userRepo.findOne({
    where: [{ email: targetEmail }, { phone: targetPhone }],
    relations: ['roles'],
  });

  const passwordHash = await argon2.hash(targetPassword);

  if (adminUser) {
    console.log(`\nFound user with email/phone (${adminUser.email} / ${adminUser.phone}). Updating to SUPER_ADMIN...`);
    adminUser.email = targetEmail;
    adminUser.phone = targetPhone;
    adminUser.fullName = 'রৌমারী জনকল্যাণ ফাউন্ডেশন সুপার অ্যাডমিন';
    adminUser.passwordHash = passwordHash;
    adminUser.status = UserStatus.ACTIVE;
    adminUser.isEmailVerified = true;
    adminUser.isPhoneVerified = true;
    adminUser.roles = [superAdminRole];
    await userRepo.save(adminUser);
    console.log('✅ Super Admin account updated!');
  } else {
    console.log(`\nCreating fresh Super Admin with email ${targetEmail} and phone ${targetPhone}...`);
    adminUser = userRepo.create({
      fullName: 'রৌমারী জনকল্যাণ ফাউন্ডেশন সুপার অ্যাডমিন',
      phone: targetPhone,
      email: targetEmail,
      district: 'Kurigram',
      upazila: 'Roumari',
      passwordHash,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isPhoneVerified: true,
      roles: [superAdminRole],
    });
    await userRepo.save(adminUser);
    console.log('✅ Super Admin account created!');
  }

  // If there's an existing user who previously had +8801712345678, also make sure they can log in if needed
  const phoneUser = await userRepo.findOne({
    where: { phone: '+8801712345678' },
    relations: ['roles'],
  });
  if (phoneUser && phoneUser.id !== adminUser.id) {
    console.log(`Also ensuring user with phone +8801712345678 has SUPER_ADMIN role...`);
    phoneUser.roles = [superAdminRole];
    phoneUser.status = UserStatus.ACTIVE;
    await userRepo.save(phoneUser);
    console.log(`✅ User ${phoneUser.email} granted SUPER_ADMIN!`);
  }

  console.log('\n=============================================');
  console.log('🎉 SUPER ADMIN ACCOUNT CREATED SUCCESSFULLY:');
  console.log('   Full Name: ' + adminUser.fullName);
  console.log('   Email:     ' + adminUser.email);
  console.log('   Phone:     ' + adminUser.phone);
  console.log('   Password:  ' + targetPassword);
  console.log('   Role:      SUPER_ADMIN');
  console.log('   Status:    ACTIVE');
  console.log('=============================================\n');

  await dataSource.destroy();
}

main().catch((err) => {
  console.error('❌ Error creating Super Admin:', err);
  process.exit(1);
});
