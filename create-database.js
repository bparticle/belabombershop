const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import postgres client
const postgres = require('postgres');

async function createTables() {
  console.log('🔧 Creating database tables...');
  
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
    const sqlFile = fs.readFileSync(path.join(__dirname, 'create-tables.sql'), 'utf8');
    
    // Execute the SQL
    await sql.unsafe(sqlFile);
    
    console.log('✅ Database tables created successfully!');
    
    // Test the connection by checking if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('products', 'variants', 'product_enhancements', 'categories', 'product_categories', 'sync_logs')
      ORDER BY table_name
    `;
    
    console.log('📋 Created tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the script
createTables()
  .then(() => {
    console.log('🎉 Database setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database setup failed:', error);
    process.exit(1);
  });
