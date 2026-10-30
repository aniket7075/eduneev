const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function auditAllRemaining() {
  console.log('🔍 Auditing all remaining modules in Database...');

  const modulesToAudit = [
    { name: 'Inventory', table: 'inventory_items', cols: ['name', 'category', 'quantity', 'unit', 'status'] },
    { name: 'Transport', table: 'transport_routes', cols: ['route_name', 'vehicle_number', 'driver_name', 'driver_phone'] },
    { name: 'CCTV', table: 'cctv_cameras', cols: ['camera_name', 'location', 'stream_url', 'status'] },
    { name: 'Homework', table: 'homework', cols: ['class_id', 'subject', 'title', 'description', 'due_date'] },
    { name: 'Lesson Plans', table: 'lesson_plans', cols: ['class_id', 'subject', 'topic', 'date', 'status'] },
    { name: 'Exam Results', table: 'results', cols: ['student_id', 'exam_id', 'marks_obtained', 'total_marks'] },
  ];

  for (const m of modulesToAudit) {
    try {
      const res = await pool.query(`
        SELECT column_name FROM information_schema.columns WHERE table_name = $1
      `, [m.table]);
      const existingCols = res.rows.map(r => r.column_name);
      console.log(`\n📋 Module: ${m.name} (Table: ${m.table})`);
      if (existingCols.length === 0) {
        console.log(`❌ Table ${m.table} DOES NOT EXIST!`);
      } else {
        console.log(`✅ Table exists. Columns: ${existingCols.join(', ')}`);
      }
    } catch (err) {
      console.error(`Error auditing ${m.name}:`, err.message);
    }
  }

  await pool.end();
}

auditAllRemaining();
