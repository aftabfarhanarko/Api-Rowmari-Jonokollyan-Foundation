require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  // 1. Create Atomic Sequence for RJF Member IDs
  await client.query(`
    CREATE SEQUENCE IF NOT EXISTS rjf_member_id_seq START WITH 1 INCREMENT BY 1;
  `);

  // 2. Create Committees Table
  await client.query(`
    CREATE TABLE IF NOT EXISTS committees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(200) NOT NULL,
      year VARCHAR(50) NOT NULL,
      type VARCHAR(100) NOT NULL DEFAULT 'EXECUTIVE', -- EXECUTIVE, ADVISORY, WORKING, SPECIAL
      term_title VARCHAR(150), -- e.g. 'ষষ্ঠ কার্যনির্বাহী পরিষদ (২০২৫-২০২৬)'
      start_date DATE,
      end_date DATE,
      description TEXT,
      featured_image VARCHAR(500),
      is_current BOOLEAN DEFAULT FALSE,
      status VARCHAR(50) DEFAULT 'PUBLISHED', -- PUBLISHED, DRAFT, ARCHIVED
      display_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 3. Create Designations Table
  await client.query(`
    CREATE TABLE IF NOT EXISTS designations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title_bn VARCHAR(150) NOT NULL,
      title_en VARCHAR(150) NOT NULL,
      slug VARCHAR(160) UNIQUE NOT NULL,
      description TEXT,
      priority INT DEFAULT 100, -- lower number = higher ranking (e.g. 1 = সভাপতি, 2 = সহ-সভাপতি)
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 4. Create Members Table with permanent unique member_id
  await client.query(`
    CREATE TABLE IF NOT EXISTS members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id VARCHAR(50) UNIQUE NOT NULL, -- Format: RJF-000001
      name_bn VARCHAR(200) NOT NULL,
      name_en VARCHAR(200) NOT NULL,
      photo_url VARCHAR(500),
      father_name VARCHAR(150),
      mother_name VARCHAR(150),
      date_of_birth DATE,
      phone_number VARCHAR(50) NOT NULL,
      email VARCHAR(150),
      blood_group VARCHAR(10),
      village VARCHAR(150),
      union_name VARCHAR(150),
      upazila VARCHAR(100) DEFAULT 'রৌমারী',
      district VARCHAR(100) DEFAULT 'কুড়িগ্রাম',
      bio TEXT,
      occupation VARCHAR(150),
      status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_members_member_id ON members(member_id);
    CREATE INDEX IF NOT EXISTS idx_members_name_bn ON members(name_bn);
    CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone_number);
  `);

  // 5. Create Committee Memberships Table (Cross-table for Member <-> Committee)
  await client.query(`
    CREATE TABLE IF NOT EXISTS committee_memberships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
      designation_id UUID NOT NULL REFERENCES designations(id) ON DELETE RESTRICT,
      start_date DATE,
      end_date DATE,
      status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, RESIGNED
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(member_id, committee_id)
    );
    CREATE INDEX IF NOT EXISTS idx_membership_committee ON committee_memberships(committee_id);
    CREATE INDEX IF NOT EXISTS idx_membership_member ON committee_memberships(member_id);
  `);

  console.log('✅ Tables and Sequence created or verified');

  // 6. Seed Designations with standard order
  const designations = [
    { title_bn: 'সভাপতি', title_en: 'President', slug: 'president', priority: 1 },
    { title_bn: 'সিনিয়র সহ-সভাপতি', title_en: 'Senior Vice President', slug: 'senior-vice-president', priority: 2 },
    { title_bn: 'সহ-সভাপতি', title_en: 'Vice President', slug: 'vice-president', priority: 3 },
    { title_bn: 'সাধারণ সম্পাদক', title_en: 'General Secretary', slug: 'general-secretary', priority: 4 },
    { title_bn: 'যুগ্ম সাধারণ সম্পাদক', title_en: 'Joint General Secretary', slug: 'joint-general-secretary', priority: 5 },
    { title_bn: 'সাংগঠনিক সম্পাদক', title_en: 'Organizing Secretary', slug: 'organizing-secretary', priority: 6 },
    { title_bn: 'কোষাধ্যক্ষ', title_en: 'Treasurer', slug: 'treasurer', priority: 7 },
    { title_bn: 'দপ্তর সম্পাদক', title_en: 'Office Secretary', slug: 'office-secretary', priority: 8 },
    { title_bn: 'প্রচার ও প্রকাশনা সম্পাদক', title_en: 'Publicity & Publication Secretary', slug: 'publicity-secretary', priority: 9 },
    { title_bn: 'সমাজকল্যাণ সম্পাদক', title_en: 'Social Welfare Secretary', slug: 'social-welfare-secretary', priority: 10 },
    { title_bn: 'ত্রাণ ও পুনর্বাসন সম্পাদক', title_en: 'Relief & Rehabilitation Secretary', slug: 'relief-secretary', priority: 11 },
    { title_bn: 'স্বাস্থ্য ও চিকিৎসা বিষয়ক সম্পাদক', title_en: 'Health & Medical Secretary', slug: 'health-secretary', priority: 12 },
    { title_bn: 'শিক্ষা ও সাহিত্য সম্পাদক', title_en: 'Education & Literature Secretary', slug: 'education-secretary', priority: 13 },
    { title_bn: 'কার্যনির্বাহী সদস্য', title_en: 'Executive Member', slug: 'executive-member', priority: 14 },
    { title_bn: 'উপদেষ্টা', title_en: 'Advisor', slug: 'advisor', priority: 15 },
    { title_bn: 'সাধারণ সদস্য', title_en: 'General Member', slug: 'general-member', priority: 20 },
  ];

  for (const d of designations) {
    await client.query(`
      INSERT INTO designations (title_bn, title_en, slug, priority)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (slug) DO UPDATE SET title_bn = EXCLUDED.title_bn, priority = EXCLUDED.priority;
    `, [d.title_bn, d.title_en, d.slug, d.priority]);
  }

  // 7. Seed Committees (Current & Previous)
  const committee1Res = await client.query(`
    INSERT INTO committees (name, year, type, term_title, is_current, status, display_order)
    VALUES ('৭ম কার্যনির্বাহী কমিটি', '২০২৫-২০২৬', 'EXECUTIVE', 'সপ্তম কার্যনির্বাহী পরিষদ (২০২৫-২০২৬)', TRUE, 'PUBLISHED', 1)
    RETURNING id;
  `);
  const c1Id = committee1Res.rows[0]?.id;

  const committee2Res = await client.query(`
    INSERT INTO committees (name, year, type, term_title, is_current, status, display_order)
    VALUES ('উপদেষ্টা পরিষদ', '২০২৪-২০২৬', 'ADVISORY', 'সম্মানিত উপদেষ্টা কমিটি', TRUE, 'PUBLISHED', 2)
    RETURNING id;
  `);
  const c2Id = committee2Res.rows[0]?.id;

  // 8. Seed Key Members with Concurrency-Safe Sequence IDs (RJF-000001, RJF-000002, etc.)
  async function createMemberWithId(data) {
    const seqRes = await client.query("SELECT nextval('rjf_member_id_seq') as seq;");
    const num = seqRes.rows[0].seq;
    const memberId = `RJF-${String(num).padStart(6, '0')}`;
    const insertRes = await client.query(`
      INSERT INTO members (member_id, name_bn, name_en, photo_url, phone_number, email, village, union_name, upazila, district, bio, occupation)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, member_id;
    `, [
      memberId, data.name_bn, data.name_en, data.photo_url || null,
      data.phone_number, data.email || null, data.village || 'রৌমারী সদর',
      data.union_name || 'রৌমারী সদর', 'রৌমারী', 'কুড়িগ্রাম', data.bio || null, data.occupation || null
    ]);
    return insertRes.rows[0];
  }

  // Find designation ids
  const desigRows = (await client.query("SELECT id, slug FROM designations;")).rows;
  const desigMap = {};
  desigRows.forEach(r => { desigMap[r.slug] = r.id; });

  // Add 4 founding/executive members
  const m1 = await createMemberWithId({
    name_bn: 'মাওলানা আব্দুল হাই',
    name_en: 'Mawlana Abdul Hai',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    phone_number: '+8801712345678',
    email: 'abdulhai@rjf.org',
    bio: 'রৌমারী জনকল্যাণ ফাউন্ডেশনের সম্মানিত সভাপতি ও প্রধান সামাজিক অভিভাবক।',
    occupation: 'শিক্ষাবিদ ও সমাজসেবক'
  });

  const m2 = await createMemberWithId({
    name_bn: 'মোঃ রফিকুল ইসলাম',
    name_en: 'Md. Rafiqul Islam',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    phone_number: '+8801723456789',
    email: 'rafiqul@rjf.org',
    bio: 'মাঠপর্যায়ের সার্বিক সমন্বয়, সাংগঠনিক প্রশাসনিক সমন্বয়ক।',
    occupation: 'ব্যবসায়ী ও সংগঠক'
  });

  const m3 = await createMemberWithId({
    name_bn: 'মোঃ আশরাফুল আলম',
    name_en: 'Md. Ashraful Alam',
    photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    phone_number: '+8801734567890',
    email: 'ashraful@rjf.org',
    bio: 'আর্থিক স্বচ্ছতা ও হিসাব নিরীক্ষার দায়িত্বপ্রাপ্ত কর্মকর্তা।',
    occupation: 'অ্যাকাউন্টস প্রফেশনাল'
  });

  const m4 = await createMemberWithId({
    name_bn: 'প্রফেসর এম. এ. লতিফ',
    name_en: 'Prof. M. A. Latif',
    photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    phone_number: '+8801745678901',
    email: 'latif@rjf.org',
    bio: 'রৌমারী সরকারি কলেজের সাবেক অধ্যাপক ও উপদেষ্টা পরিষদের প্রধান।',
    occupation: 'অবসরপ্রাপ্ত অধ্যাপক'
  });

  // Assign memberships
  if (c1Id && desigMap['president']) {
    await client.query(`
      INSERT INTO committee_memberships (member_id, committee_id, designation_id, status)
      VALUES ($1, $2, $3, 'ACTIVE') ON CONFLICT DO NOTHING;
    `, [m1.id, c1Id, desigMap['president']]);
  }
  if (c1Id && desigMap['general-secretary']) {
    await client.query(`
      INSERT INTO committee_memberships (member_id, committee_id, designation_id, status)
      VALUES ($1, $2, $3, 'ACTIVE') ON CONFLICT DO NOTHING;
    `, [m2.id, c1Id, desigMap['general-secretary']]);
  }
  if (c1Id && desigMap['treasurer']) {
    await client.query(`
      INSERT INTO committee_memberships (member_id, committee_id, designation_id, status)
      VALUES ($1, $2, $3, 'ACTIVE') ON CONFLICT DO NOTHING;
    `, [m3.id, c1Id, desigMap['treasurer']]);
  }
  if (c2Id && desigMap['advisor']) {
    await client.query(`
      INSERT INTO committee_memberships (member_id, committee_id, designation_id, status)
      VALUES ($1, $2, $3, 'ACTIVE') ON CONFLICT DO NOTHING;
    `, [m4.id, c2Id, desigMap['advisor']]);
  }

  console.log('✅ Seeded committees, designations, members and assignments successfully');
  await client.end();
}

run().catch(console.error);
