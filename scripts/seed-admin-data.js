require('dotenv').config();
const { Client } = require('pg');

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to DB');

  // Help applications
  const existingApp = await client.query('SELECT id FROM help_applications LIMIT 1;');
  if (existingApp.rows.length < 2) {
    await client.query(
      `INSERT INTO help_applications (reference_code, applicant_name, applicant_phone, category, requested_amount, status, address, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8), ($9, $10, $11, $12, $13, $14, $15, $16);`,
      [
        'RJF-MED-2026-001', 'আব্দুল করিম', '+8801799887766', 'MEDICAL', 15000, 'PENDING', 'গ্রাম: কাজাইকাটা, রৌমারী, কুড়িগ্রাম', 'জরুরি হৃদরোগের চিকিৎসা সহায়তা প্রয়োজন।',
        'RJF-EDU-2026-002', 'সুমাইয়া আক্তার', '+8801755443322', 'EDUCATION', 12000, 'APPROVED', 'রৌমারী সদর, কুড়িগ্রাম', 'উচ্চ মাধ্যমিক পরীক্ষার ফি ও বইপত্র কেনার জন্য বৃত্তি সহায়তা।'
      ]
    );
    console.log('✅ Seeded help applications');
  }

  const counts = await client.query(`
    SELECT 
      (SELECT COUNT(*) FROM users) as users_count,
      (SELECT COUNT(*) FROM pages) as pages_count,
      (SELECT COUNT(*) FROM news_events) as news_count,
      (SELECT COUNT(*) FROM gallery_items) as gallery_count,
      (SELECT COUNT(*) FROM campaigns) as campaigns_count,
      (SELECT COUNT(*) FROM help_applications) as applications_count,
      (SELECT COUNT(*) FROM volunteer_profiles) as volunteers_count,
      (SELECT COUNT(*) FROM contact_messages) as messages_count,
      (SELECT COUNT(*) FROM audit_logs) as audit_count
  `);
  console.log('Updated Table counts:', counts.rows[0]);

  await client.end();
}

seed().catch(console.error);
