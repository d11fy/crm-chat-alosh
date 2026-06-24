const { Client } = require('pg');
require('dotenv').config();

// Try port 6543 instead of 5432
const dbUrl = process.env.DATABASE_URL.replace(':5432/', ':6543/') + '?pgbouncer=true';

console.log("Connecting to:", dbUrl.replace(/:[^:]+@/, ':****@'));

const client = new Client({
  connectionString: dbUrl,
});

async function main() {
  try {
    await client.connect();
    console.log("✅ Successfully connected to Supabase Database via Transaction Pooler (6543)!");
    const res = await client.query('SELECT NOW()');
    console.log("DB Time:", res.rows[0].now);
    await client.end();
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
  }
}

main();
