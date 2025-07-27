import { query } from '../utils/database.js';

const showSchema = async () => {
  try {
    console.log('=== POSTGRESQL DATABASE SCHEMA & DATA ===\n');
    
    // Get all tables
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      console.log(`\n🗂️  TABLE: ${tableName.toUpperCase()}`);
      console.log('=' .repeat(60));
      
      // Get table schema
      const schemaResult = await query(`
        SELECT 
          column_name, 
          data_type, 
          character_maximum_length,
          is_nullable, 
          column_default,
          ordinal_position
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      console.log('\n📋 SCHEMA:');
      console.log('Column'.padEnd(20) + 'Type'.padEnd(25) + 'Nullable'.padEnd(10) + 'Default');
      console.log('-'.repeat(70));
      
      schemaResult.rows.forEach(col => {
        let dataType = col.data_type;
        if (col.character_maximum_length) {
          dataType += `(${col.character_maximum_length})`;
        }
        
        const nullable = col.is_nullable === 'YES' ? 'YES' : 'NO';
        const defaultVal = col.column_default || '';
        
        console.log(
          col.column_name.padEnd(20) + 
          dataType.padEnd(25) + 
          nullable.padEnd(10) + 
          defaultVal
        );
      });
      
      // Get constraints
      const constraintsResult = await query(`
        SELECT 
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = $1
        ORDER BY tc.constraint_type, tc.constraint_name
      `, [tableName]);
      
      if (constraintsResult.rows.length > 0) {
        console.log('\n🔗 CONSTRAINTS:');
        constraintsResult.rows.forEach(constraint => {
          let constraintInfo = `${constraint.constraint_type}: ${constraint.column_name}`;
          if (constraint.foreign_table_name) {
            constraintInfo += ` → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`;
          }
          console.log(`  • ${constraintInfo}`);
        });
      }
      
      // Get row count and sample data
      const countResult = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const rowCount = parseInt(countResult.rows[0].count);
      
      console.log(`\n📊 DATA (${rowCount} rows):`);
      
      if (rowCount === 0) {
        console.log('  (No data)');
        continue;
      }
      
      // Show sample data
      const limit = Math.min(rowCount, 5);
      const dataResult = await query(`SELECT * FROM ${tableName} ORDER BY id LIMIT ${limit}`);
      
      if (dataResult.rows.length > 0) {
        const columns = Object.keys(dataResult.rows[0]);
        
        // Create formatted table
        const colWidths = columns.map(col => {
          const maxDataWidth = Math.max(...dataResult.rows.map(row => {
            const val = row[col];
            if (val === null) return 4; // "NULL"
            return val.toString().length;
          }));
          return Math.max(col.length, maxDataWidth, 8); // minimum 8 chars
        });
        
        // Header
        const header = columns.map((col, i) => col.padEnd(colWidths[i])).join(' | ');
        console.log(`  ${header}`);
        console.log(`  ${colWidths.map(w => '-'.repeat(w)).join('-+-')}`);
        
        // Data rows
        dataResult.rows.forEach(row => {
          const rowStr = columns.map((col, i) => {
            let val = row[col];
            if (val === null) val = 'NULL';
            else if (typeof val === 'string' && val.length > colWidths[i]) {
              val = val.substring(0, colWidths[i] - 3) + '...';
            }
            return val.toString().padEnd(colWidths[i]);
          }).join(' | ');
          console.log(`  ${rowStr}`);
        });
        
        if (rowCount > limit) {
          console.log(`  ... and ${rowCount - limit} more rows`);
        }
      }
    }
    
    // Show database info
    console.log('\n\n=== DATABASE INFO ===');
    const dbInfo = await query('SELECT current_database(), current_user, version()');
    console.log(`Database: ${dbInfo.rows[0].current_database}`);
    console.log(`User: ${dbInfo.rows[0].current_user}`);
    console.log(`Version: ${dbInfo.rows[0].version}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

showSchema();