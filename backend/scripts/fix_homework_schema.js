const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../dist/config/database');

async function main() {
  try {
    const hwCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'homework'");
    console.log("HW COLS:", hwCols.rows);

    // If grade column doesn't exist on homework, add it!
    const hasGradeCol = hwCols.rows.some(r => r.column_name === 'grade');
    if (!hasGradeCol) {
      await pool.query("ALTER TABLE homework ADD COLUMN grade VARCHAR(100)");
      console.log("Added 'grade' column to homework table!");
    }

    // Also ensure each class in classes has at least 1 section in sections table!
    const classes = await pool.query("SELECT id, name FROM classes");
    for (const c of classes.rows) {
      const secCheck = await pool.query("SELECT id FROM sections WHERE class_id = $1", [c.id]);
      if (secCheck.rows.length === 0) {
        await pool.query(
          "INSERT INTO sections (class_id, name, capacity) VALUES ($1, 'A', 30)",
          [c.id]
        );
        console.log(`Created Section A for class: ${c.name}`);
      }
    }

    // Also add Daycare to classes if not exists
    const daycareCheck = await pool.query("SELECT id FROM classes WHERE LOWER(name) = 'daycare'");
    if (daycareCheck.rows.length === 0) {
      const dayClass = await pool.query("INSERT INTO classes (name, description, capacity) VALUES ('Daycare', 'Daycare Full Day Care', 30) RETURNING id");
      await pool.query("INSERT INTO sections (class_id, name, capacity) VALUES ($1, 'A', 30)", [dayClass.rows[0].id]);
      console.log("Added Daycare class and section!");
    }

    // Check existing homework and assign grade if null
    await pool.query("UPDATE homework SET grade = 'Nursery' WHERE grade IS NULL");
    
    console.log("Database updated successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

main();
