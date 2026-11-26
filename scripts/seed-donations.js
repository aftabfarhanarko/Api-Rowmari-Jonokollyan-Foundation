require('dotenv').config();
const { Client } = require('pg');

async function seedDonations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const campRes = await client.query('SELECT id FROM campaigns LIMIT 1;');
  const campaignId = campRes.rows.length > 0 ? campRes.rows[0].id : null;

  await client.query(
    `INSERT INTO donations (donor_name, donor_phone, amount, currency, payment_method, sender_phone, transaction_reference, status, notes, campaign_id, verified_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
    ['মোঃ আব্দুল্লাহ', '+8801712345001', 1000, 'BDT', 'BKASH', '+8801712345001', 'TRX-BK-991823', 'APPROVED', 'শীতবস্ত্র তহবিলে সাধারণ অনুদান', campaignId]
  );

  await client.query(
    `INSERT INTO donations (donor_name, donor_phone, amount, currency, payment_method, sender_phone, transaction_reference, status, notes, campaign_id, verified_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
    ['তানিয়া ইসলাম', '+8801819283746', 2500, 'BDT', 'NAGAD', '+8801819283746', 'TRX-NG-772819', 'APPROVED', 'মেডিকেল ক্যাম্পের জন্য অনুদান', campaignId]
  );

  await client.query(
    `INSERT INTO donations (donor_name, donor_phone, amount, currency, payment_method, sender_phone, transaction_reference, status, notes, campaign_id, verified_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL)`,
    ['কামাল হোসেন', '+8801912837465', 500, 'BDT', 'ROCKET', '+8801912837465', 'TRX-RK-112233', 'PENDING', 'অপেক্ষমান অনুদান', campaignId]
  );

  console.log('✅ Seeded approved and pending donations');
  const stats = await client.query('SELECT status, count(*), sum(amount) from donations group by status;');
  console.log('Donations by status in DB:', stats.rows);

  await client.end();
}

seedDonations().catch(console.error);
