const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('Setting up student_milestones table in PostgreSQL...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_milestones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        domain VARCHAR(150) NOT NULL,
        skill VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        remark TEXT,
        evaluated_at DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Clean up any old milestones if needed or populate for Sneha Jain
    const sneha = await pool.query("SELECT id FROM students WHERE first_name ILIKE '%Sneha%' LIMIT 1");
    if (sneha.rows.length > 0) {
      const studentId = sneha.rows[0].id;
      // Clear out any previous milestone rows for clean sync
      await pool.query('DELETE FROM student_milestones WHERE student_id = $1', [studentId]);

      const records = [
        // Physical & Motor Skills (strictly English)
        { domain: 'Physical & Motor Skills', skill: 'Pencil / Crayon Grip & Scribbling', status: 'Excellent', rating: 5, remark: 'Firm tripod grip developed; colors within boundaries' },
        { domain: 'Physical & Motor Skills', skill: 'Scissor Skills & Paper Folding', status: 'Good', rating: 4, remark: 'Safe usage; cuts straight lines with guided supervision' },
        { domain: 'Physical & Motor Skills', skill: 'Gross Motor & Balance Activities', status: 'Excellent', rating: 5, remark: 'Active participation in outdoor running, hopping and obstacle courses' },
        { domain: 'Physical & Motor Skills', skill: 'Hand-Eye Coordination', status: 'Excellent', rating: 5, remark: 'Proficient in bead threading, puzzle solving and block stacking' },
        
        // Language & Literacy (strictly English)
        { domain: 'Language & Literacy', skill: 'Phonics & Letter Sound Recognition', status: 'Excellent', rating: 5, remark: 'Accurately identifies initial phonics sounds (A-Z)' },
        { domain: 'Language & Literacy', skill: 'Rhymes Recitation & Rhythm', status: 'Excellent', rating: 5, remark: 'Loves singing classroom rhymes with expressive actions' },
        { domain: 'Language & Literacy', skill: 'Listening Comprehension & Storytelling', status: 'Good', rating: 4, remark: 'Attentive during story hour; answers simple story questions' },
        { domain: 'Language & Literacy', skill: 'Vocabulary & Self Expression', status: 'Excellent', rating: 5, remark: 'Expresses needs and curiosities confidently with peers & teachers' },

        // Cognitive & Numeracy Skills (strictly English)
        { domain: 'Cognitive & Numeracy Skills', skill: 'Number Counting & Quantity (1-20)', status: 'Excellent', rating: 5, remark: 'Counts objects with one-to-one correspondence accurately' },
        { domain: 'Cognitive & Numeracy Skills', skill: 'Color & 2D Shape Identification', status: 'Excellent', rating: 5, remark: 'Quickly distinguishes Circle, Triangle, Square and Rectangle' },
        { domain: 'Cognitive & Numeracy Skills', skill: 'Pattern Matching & Sorting', status: 'Good', rating: 4, remark: 'Classifies toys and flashcards by color and size categories' },
        { domain: 'Cognitive & Numeracy Skills', skill: 'Curiosity & Inquiry Mindset', status: 'Excellent', rating: 5, remark: 'Eager to explore new science & nature sensory themes' },

        // Social & Emotional Development (strictly English)
        { domain: 'Social & Emotional Development', skill: 'Sharing & Cooperative Play', status: 'Excellent', rating: 5, remark: 'Shares toys willingly; polite and friendly in group play' },
        { domain: 'Social & Emotional Development', skill: 'Following Classroom Routines', status: 'Excellent', rating: 5, remark: 'Follows instructions and cleans up after play sessions' },
        { domain: 'Social & Emotional Development', skill: 'Independence & Self-Care Habits', status: 'Good', rating: 4, remark: 'Manages snack box and water bottle independently' },
        { domain: 'Social & Emotional Development', skill: 'Empathy & Peer Interaction', status: 'Excellent', rating: 5, remark: 'Comforts friends and shows kindness in circle time' },

        // Creative Arts & Music (strictly English)
        { domain: 'Creative Arts & Music', skill: 'Freehand Drawing & Finger Painting', status: 'Excellent', rating: 5, remark: 'Vibrant color choices and joyful artistic creativity' },
        { domain: 'Creative Arts & Music', skill: 'Music, Dance & Movement', status: 'Excellent', rating: 5, remark: 'Follows musical beats with enthusiasm during morning assembly' },
        { domain: 'Creative Arts & Music', skill: 'Clay & Dough Craft Modeling', status: 'Good', rating: 4, remark: 'Enjoys molding playdough into imaginative shapes' }
      ];

      for (const rec of records) {
        await pool.query(
          'INSERT INTO student_milestones (student_id, domain, skill, status, rating, remark) VALUES ($1, $2, $3, $4, $5, $6)',
          [studentId, rec.domain, rec.skill, rec.status, rec.rating, rec.remark]
        );
      }
      console.log(`Successfully seeded ${records.length} real milestones in database for student ${studentId}`);
    }

    console.log('✅ Milestone setup completed successfully');
  } catch (err) {
    console.error('Error setting up milestones:', err);
  } finally {
    await pool.end();
  }
}

main();
