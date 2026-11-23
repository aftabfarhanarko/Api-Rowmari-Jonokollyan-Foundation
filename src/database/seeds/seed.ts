import * as net from 'net';
if (typeof (net as any).setDefaultAutoSelectFamily === 'function') {
  (net as any).setDefaultAutoSelectFamily(false);
}

import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/access-control/entities/role.entity';
import { Permission } from '../../modules/access-control/entities/permission.entity';
import { Campaign } from '../../modules/campaigns/entities/campaign.entity';
import { MedicalCamp } from '../../modules/medical-camps/entities/medical-camp.entity';
import { Page } from '../../modules/content/entities/content.entity';
import { UserStatus, RoleName, PERMISSION_KEYS, CampaignStatus } from '../../common/constants';

async function runSeed() {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/romonijon_db';
  const requiresSsl =
    process.env.NODE_ENV === 'production' ||
    databaseUrl.includes('sslmode=require') ||
    databaseUrl.includes('neon.tech');

  const dataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    entities: [path.join(__dirname, '/../../**/*.entity{.ts,.js}')],
    // Schema changes must be applied through migrations, never implicitly by a seed run.
    synchronize: false,
    ssl: requiresSsl ? { rejectUnauthorized: true } : false,
    extra: {
      max: 10,
      connectionTimeoutMillis: 10000,
    },
  });

  await dataSource.initialize();
  console.log('✅ Connected to database for seeding...');

  const permRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);
  const campaignRepo = dataSource.getRepository(Campaign);
  const campRepo = dataSource.getRepository(MedicalCamp);
  const pageRepo = dataSource.getRepository(Page);

  // 1. Seed Permissions
  const permissions: Permission[] = [];
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
    permissions.push(perm);
  }
  console.log(`✅ Seeded ${permissions.length} permissions.`);

  // 2. Seed Roles
  let superAdminRole = await roleRepo.findOne({ where: { name: RoleName.SUPER_ADMIN } });
  if (!superAdminRole) {
    superAdminRole = roleRepo.create({
      name: RoleName.SUPER_ADMIN,
      description: 'Super Administrator with complete privileges',
      permissions,
    });
    superAdminRole = await roleRepo.save(superAdminRole);
  }

  let adminRole = await roleRepo.findOne({ where: { name: RoleName.ADMIN } });
  if (!adminRole) {
    adminRole = roleRepo.create({
      name: RoleName.ADMIN,
      description: 'System Administrator',
      permissions: permissions.filter((p) => !p.key.startsWith('roles.')),
    });
    adminRole = await roleRepo.save(adminRole);
  }

  const roleConfigs = [
    {
      name: RoleName.BLOOD_COORDINATOR,
      description: 'Blood Donation Coordinator',
      permKeys: [
        PERMISSION_KEYS.DONORS_VIEW_PRIVATE,
        PERMISSION_KEYS.DONORS_VERIFY,
        PERMISSION_KEYS.BLOOD_REQUESTS_MANAGE,
      ],
    },
    {
      name: RoleName.MEDICAL_COORDINATOR,
      description: 'Medical Camp & Healthcare Assistance Coordinator',
      permKeys: [
        PERMISSION_KEYS.CAMPS_MANAGE,
        PERMISSION_KEYS.APPLICATIONS_VIEW,
        PERMISSION_KEYS.APPLICATIONS_REVIEW,
      ],
    },
    {
      name: RoleName.EDUCATION_COORDINATOR,
      description: 'Education Assistance & Youth Campaign Coordinator',
      permKeys: [
        PERMISSION_KEYS.APPLICATIONS_VIEW,
        PERMISSION_KEYS.APPLICATIONS_REVIEW,
        PERMISSION_KEYS.CAMPAIGNS_MANAGE,
      ],
    },
    {
      name: RoleName.VOLUNTEER_MANAGER,
      description: 'Volunteer Network & Field Operations Manager',
      permKeys: [
        PERMISSION_KEYS.VOLUNTEERS_MANAGE,
        PERMISSION_KEYS.CAMPS_MANAGE,
      ],
    },
    {
      name: RoleName.CONTENT_MANAGER,
      description: 'Website Content & Public Campaign Manager',
      permKeys: [
        PERMISSION_KEYS.CONTENT_MANAGE,
        PERMISSION_KEYS.CAMPAIGNS_CREATE,
        PERMISSION_KEYS.CAMPAIGNS_MANAGE,
      ],
    },
    {
      name: RoleName.FINANCE_MANAGER,
      description: 'Finance Manager for donations, expenses & reports',
      permKeys: [
        PERMISSION_KEYS.DONATIONS_VIEW,
        PERMISSION_KEYS.EXPENSES_CREATE,
        PERMISSION_KEYS.EXPENSES_APPROVE,
        PERMISSION_KEYS.REPORTS_VIEW,
      ],
    },
  ];

  for (const config of roleConfigs) {
    let role = await roleRepo.findOne({ where: { name: config.name } });
    if (!role) {
      const permKeySet = new Set<string>(config.permKeys);
      const assignedPerms = permissions.filter((p) => permKeySet.has(p.key));
      role = roleRepo.create({
        name: config.name,
        description: config.description,
        permissions: assignedPerms,
      });
      await roleRepo.save(role);
    }
  }

  let memberRole = await roleRepo.findOne({ where: { name: RoleName.COMMUNITY_MEMBER } });
  if (!memberRole) {
    memberRole = roleRepo.create({
      name: RoleName.COMMUNITY_MEMBER,
      description: 'Community Member / Public Registered User',
      permissions: [],
    });
    memberRole = await roleRepo.save(memberRole);
  }
  console.log('✅ Roles verified.');

  // 3. Seed Super Admin User
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const adminPhone = process.env.BOOTSTRAP_ADMIN_PHONE;
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!adminEmail || !adminPhone || !adminPassword || adminPassword.length < 12) {
    throw new Error('Set BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PHONE, and a BOOTSTRAP_ADMIN_PASSWORD of at least 12 characters before seeding.');
  }
  let adminUser = await userRepo.findOne({ where: { email: adminEmail } });
  if (!adminUser) {
    const passwordHash = await argon2.hash(adminPassword);
    adminUser = userRepo.create({
      fullName: 'RKF Foundation Super Admin',
      phone: adminPhone,
      email: adminEmail,
      district: 'Kurigram',
      upazila: 'Roumari',
      passwordHash,
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      roles: [superAdminRole],
    });
    await userRepo.save(adminUser);
    console.log(`✅ Super Admin created with Email: ${adminEmail}`);
  }

  // 4. Seed Initial Campaign
  const existingCampaign = await campaignRepo.findOne({ where: { slug: 'winter-warmth-roumari-2026' } });
  if (!existingCampaign) {
    const campaign = campaignRepo.create({
      title: 'Winter Warmth for Char & Roumari Families 2026',
      slug: 'winter-warmth-roumari-2026',
      description: 'Providing warm blankets, sweaters, and winter food packs to vulnerable families in riverside char areas of Roumari, Kurigram.',
      category: 'Winter Relief',
      targetAmount: 250000,
      raisedAmount: 45000,
      startDate: new Date(),
      status: CampaignStatus.ACTIVE,
      isFeatured: true,
    });
    await campaignRepo.save(campaign);
    console.log('✅ Sample campaign seeded.');
  }

  // 5. Seed Initial CMS Pages
  const existingPage = await pageRepo.findOne({ where: { slug: 'about-us' } });
  if (!existingPage) {
    const page = pageRepo.create({
      title: 'About Romonijon Kallyan Foundation',
      slug: 'about-us',
      content: 'Romonijon Kallyan Foundation is a voluntary, non-political humanitarian organization operating in Roumari, Kurigram, Bangladesh...',
    });
    await pageRepo.save(page);
    console.log('✅ Sample About Us page seeded.');
  }

  await dataSource.destroy();
  console.log('🎉 Seeding successfully completed!');
}

runSeed().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
