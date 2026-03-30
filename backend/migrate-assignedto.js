/**
 * One-time migration: change assignedTo column from INTEGER → TEXT
 * so it can store JSON strings like '[1,2]' or 'all'
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

  // Find the actual table name (LoopBack lowercases model names)
  const tables = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  );
  console.log('Tables in DB:', tables.rows.map(r => r.tablename).join(', '));

  // Check current type of assignedTo
  const colCheck = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name ILIKE 'assignedto'
  `);
  console.log('Current assignedTo columns:', colCheck.rows);

  for (const row of colCheck.rows) {
    const tableName = row.column_name; // Not right, let's re-query
  }

  // Get table+column pairs for assignedTo
  const cols = await client.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name ILIKE 'assignedto'
  `);
  
  for (const col of cols.rows) {
    console.log(`Found: ${col.table_name}.${col.column_name} (${col.data_type})`);
    if (col.data_type === 'integer') {
      console.log(`Altering ${col.table_name}.${col.column_name} to TEXT...`);
      await client.query(`
        ALTER TABLE "${col.table_name}"
        ALTER COLUMN "${col.column_name}" TYPE TEXT USING "${col.column_name}"::TEXT
      `);
      console.log(`✅ Done! Column is now TEXT.`);
    } else if (col.data_type === 'text' || col.data_type === 'character varying') {
      console.log(`✅ Column is already ${col.data_type}, no migration needed.`);
    }
  }

  await client.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
