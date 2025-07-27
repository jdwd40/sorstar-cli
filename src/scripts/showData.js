import { query } from '../utils/database.js';

const showData = async () => {
  try {
    console.log('=== SORSTAR DATABASE CONTENTS ===\n');
    
    // Get all tables
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      console.log(`\n📊 ${tableName.toUpperCase()} TABLE:`);
      console.log('=' .repeat(50));
      
      // Get row count
      const countResult = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const rowCount = countResult.rows[0].count;
      
      if (rowCount === '0') {
        console.log('(Empty table)');
        continue;
      }
      
      // Get all data from the table
      const dataResult = await query(`SELECT * FROM ${tableName} ORDER BY id LIMIT 20`);
      
      if (dataResult.rows.length > 0) {
        // Show column headers
        const columns = Object.keys(dataResult.rows[0]);
        console.log(columns.join(' | '));
        console.log('-'.repeat(columns.join(' | ').length));
        
        // Show data rows
        dataResult.rows.forEach(row => {
          const values = columns.map(col => {
            let val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string' && val.length > 30) {
              return val.substring(0, 27) + '...';
            }
            return val.toString();
          });
          console.log(values.join(' | '));
        });
        
        if (rowCount > 20) {
          console.log(`... and ${rowCount - 20} more rows`);
        }
      }
      
      console.log(`\nTotal rows: ${rowCount}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

showData();