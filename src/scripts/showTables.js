import { query } from '../utils/database.js';

const showTables = async () => {
  try {
    console.log('=== SORSTAR DATABASE TABLES ===\n');
    
    // Get all tables
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    console.log('\n=== TABLE DETAILS ===\n');
    
    // Show details for each table
    for (const table of tablesResult.rows) {
      console.log(`\n${table.table_name.toUpperCase()} TABLE:`);
      
      const columnsResult = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table.table_name]);
      
      columnsResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  ${col.column_name} - ${col.data_type} ${nullable}${defaultVal}`);
      });
      
      // Show row count
      const countResult = await query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
      console.log(`  → ${countResult.rows[0].count} rows`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

showTables();