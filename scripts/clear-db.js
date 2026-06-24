const { Client } = require('pg');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("❌ DATABASE_URL is missing in .env");
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log("Connected to DB to clear mock data...");
    
    // Use TRUNCATE CASCADE to clean all customer data
    await client.query('TRUNCATE TABLE "Customer" CASCADE;');
    console.log("✅ Successfully truncated Customer and all related tables (CustomerMemory, Message, Sale, AIEvent, AnalysisQueue)!");
    
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to clear database:", error);
    process.exit(1);
  }
}
main();
