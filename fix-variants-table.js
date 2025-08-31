const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import postgres client
const postgres = require('postgres');

async function fixVariantsTable() {
  console.log('🔧 Fixing variants table (changing printful_id to BIGINT)...');
  
  // Create connection string
  const connectionString = `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}?sslmode=${process.env.DATABASE_SSL === 'true' ? 'require' : 'disable'}`;
  
  // Create postgres client
  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // Read the SQL file
    const sqlFile = fs.readFileSync(path.join(__dirname, 'fix-variants-table.sql'), 'utf8');
    
    // Execute the SQL
    await sql.unsafe(sqlFile);
    
    console.log('✅ Variants table fixed successfully!');
    console.log('📋 Changed printful_id from INTEGER to BIGINT');
    
  } catch (error) {
    console.error('❌ Error fixing variants table:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the script
fixVariantsTable()
  .then(() => {
    console.log('🎉 Variants table fix complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Variants table fix failed:', error);
    process.exit(1);
  });
