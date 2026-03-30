/**
 * Fix: drop and recreate the "notification" table with LOWERCASE column names.
 * LoopBack's PostgreSQL connector lowercases all column names.
 * Run: node migrate-notification.js
 */
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Guru@1234',
  database: 'teamflow_db',
});

async function migrate() {
  await client.connect();
  console.log('Connected to PostgreSQL.');

  // Drop old table if it exists (might have wrong column casing)
  await client.query(`DROP TABLE IF EXISTS "notification"`);
  console.log('Dropped old "notification" table (if any).');

  // Create with LOWERCASE column names (LoopBack convention for PostgreSQL)
  await client.query(`
    CREATE TABLE "notification" (
      "id"         SERIAL PRIMARY KEY,
      "userid"     INTEGER       NOT NULL,
      "type"       VARCHAR(64)   NOT NULL,
      "message"    TEXT          NOT NULL,
      "taskid"     INTEGER,
      "isread"     BOOLEAN       NOT NULL DEFAULT FALSE,
      "createdat"  TIMESTAMPTZ
    )
  `);

  console.log('✅ Table "notification" created with lowercase columns.');
  await client.end();
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
