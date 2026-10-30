const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setup() {
  try {
    console.log('🚀 Creating franchise_fee_structures table...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS franchise_fee_structures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
        academic_year VARCHAR(50) NOT NULL DEFAULT '2026-2027',
        grade VARCHAR(50) NOT NULL,
        annual_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
        annual_admission_split NUMERIC(10, 2) NOT NULL DEFAULT 0,
        annual_may_split NUMERIC(10, 2) NOT NULL DEFAULT 0,
        term1_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
        term1_early_bird NUMERIC(10, 2) NOT NULL DEFAULT 0,
        term1_due_date DATE DEFAULT '2026-06-05',
        term2_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
        term2_early_bird NUMERIC(10, 2) NOT NULL DEFAULT 0,
        term2_due_date DATE DEFAULT '2026-10-05',
        total_installments NUMERIC(10, 2) NOT NULL DEFAULT 0,
        total_early_installments NUMERIC(10, 2) NOT NULL DEFAULT 0,
        lump_sum_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
        lump_sum_early_bird NUMERIC(10, 2) NOT NULL DEFAULT 0,
        early_bird_deadline DATE DEFAULT '2026-07-15',
        notes TEXT,
        admission_requirements TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_default_fee_struct 
        ON franchise_fee_structures (academic_year, grade) 
        WHERE school_id IS NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_school_fee_struct 
        ON franchise_fee_structures (school_id, academic_year, grade) 
        WHERE school_id IS NOT NULL;
    `);

    console.log('✅ Table and indexes created successfully.');

    // Fetch Chinchwad school ID
    const schoolRes = await pool.query(`SELECT id, name FROM schools WHERE name ILIKE '%Chinchwad%' LIMIT 1`);
    const chinchwadId = schoolRes.rows[0]?.id || null;
    console.log('Chinchwad School ID:', chinchwadId);

    const standardNotes = `*Annual fee incl. Initial kit + Study material + Field trips fee + Stationery fee + Special day celebration fee.
Please note:
1. Payment by Cash or Cheque in favour of "EduNeev kids Preschool"
2. Pre-school timings Mon to Fri from 10:00am to 1:00pm.
3. Transport charges as per distance from school.
4. Fee once paid is not refundable.
5. No additional charges for Value Added Services, Books, Initial Kit.
6. Rs.500 payable in case of a cheque dishonored.
7. Please insist for receipts for every payment.`;

    const standardRequirements = `1. Two Passport size & two stamp size photographs of child.
2. Two Passport size photograph of parents/guardian with child.
3. Birth Certificate.`;

    const feeData = [
      {
        grade: 'Playgroup',
        annual_fee: 10500,
        annual_admission_split: 5000,
        annual_may_split: 5500,
        term1_fee: 9450,
        term1_early_bird: 7090,
        term1_due_date: '2026-06-05',
        term2_fee: 9450,
        term2_early_bird: 7090,
        term2_due_date: '2026-10-05',
        total_installments: 29400,
        total_early_installments: 24680,
        lump_sum_fee: 28900,
        lump_sum_early_bird: 24180
      },
      {
        grade: 'Nursery',
        annual_fee: 16500,
        annual_admission_split: 8250,
        annual_may_split: 8250,
        term1_fee: 14250,
        term1_early_bird: 11115,
        term1_due_date: '2026-06-05',
        term2_fee: 14250,
        term2_early_bird: 11115,
        term2_due_date: '2026-10-05',
        total_installments: 45000,
        total_early_installments: 38730,
        lump_sum_fee: 44500,
        lump_sum_early_bird: 38230
      },
      {
        grade: 'LKG',
        annual_fee: 18150,
        annual_admission_split: 9075,
        annual_may_split: 9075,
        term1_fee: 15070,
        term1_early_bird: 11615,
        term1_due_date: '2026-06-05',
        term2_fee: 15070,
        term2_early_bird: 11615,
        term2_due_date: '2026-10-05',
        total_installments: 48290,
        total_early_installments: 41380,
        lump_sum_fee: 47790,
        lump_sum_early_bird: 40880
      },
      {
        grade: 'UKG',
        annual_fee: 18150,
        annual_admission_split: 9075,
        annual_may_split: 9075,
        term1_fee: 15620,
        term1_early_bird: 12030,
        term1_due_date: '2026-06-05',
        term2_fee: 15620,
        term2_early_bird: 12030,
        term2_due_date: '2026-10-05',
        total_installments: 49390,
        total_early_installments: 42210,
        lump_sum_fee: 48890,
        lump_sum_early_bird: 41710
      },
      {
        grade: 'Daycare',
        annual_fee: 12000,
        annual_admission_split: 6000,
        annual_may_split: 6000,
        term1_fee: 12000,
        term1_early_bird: 10000,
        term1_due_date: '2026-06-05',
        term2_fee: 12000,
        term2_early_bird: 10000,
        term2_due_date: '2026-10-05',
        total_installments: 36000,
        total_early_installments: 32000,
        lump_sum_fee: 35000,
        lump_sum_early_bird: 31000
      }
    ];

    // Seed into Default Master (school_id = null)
    for (const item of feeData) {
      await pool.query(`
        INSERT INTO franchise_fee_structures (
          school_id, academic_year, grade, annual_fee, annual_admission_split, annual_may_split,
          term1_fee, term1_early_bird, term1_due_date, term2_fee, term2_early_bird, term2_due_date,
          total_installments, total_early_installments, lump_sum_fee, lump_sum_early_bird,
          early_bird_deadline, notes, admission_requirements, updated_at
        ) VALUES (
          null, '2026-2027', $1, $2, $3, $4,
          $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14,
          '2026-07-15', $15, $16, NOW()
        )
        ON CONFLICT (academic_year, grade) WHERE school_id IS NULL
        DO UPDATE SET
          annual_fee = EXCLUDED.annual_fee,
          annual_admission_split = EXCLUDED.annual_admission_split,
          annual_may_split = EXCLUDED.annual_may_split,
          term1_fee = EXCLUDED.term1_fee,
          term1_early_bird = EXCLUDED.term1_early_bird,
          term1_due_date = EXCLUDED.term1_due_date,
          term2_fee = EXCLUDED.term2_fee,
          term2_early_bird = EXCLUDED.term2_early_bird,
          term2_due_date = EXCLUDED.term2_due_date,
          total_installments = EXCLUDED.total_installments,
          total_early_installments = EXCLUDED.total_early_installments,
          lump_sum_fee = EXCLUDED.lump_sum_fee,
          lump_sum_early_bird = EXCLUDED.lump_sum_early_bird,
          notes = EXCLUDED.notes,
          admission_requirements = EXCLUDED.admission_requirements,
          updated_at = NOW();
      `, [
        item.grade, item.annual_fee, item.annual_admission_split, item.annual_may_split,
        item.term1_fee, item.term1_early_bird, item.term1_due_date, item.term2_fee, item.term2_early_bird, item.term2_due_date,
        item.total_installments, item.total_early_installments, item.lump_sum_fee, item.lump_sum_early_bird,
        standardNotes, standardRequirements
      ]);
    }
    console.log('✅ Default Master fee structures seeded.');

    // Seed into Chinchwad School ID
    if (chinchwadId) {
      for (const item of feeData) {
        await pool.query(`
          INSERT INTO franchise_fee_structures (
            school_id, academic_year, grade, annual_fee, annual_admission_split, annual_may_split,
            term1_fee, term1_early_bird, term1_due_date, term2_fee, term2_early_bird, term2_due_date,
            total_installments, total_early_installments, lump_sum_fee, lump_sum_early_bird,
            early_bird_deadline, notes, admission_requirements, updated_at
          ) VALUES (
            $1, '2026-2027', $2, $3, $4, $5,
            $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15,
            '2026-07-15', $16, $17, NOW()
          )
          ON CONFLICT (school_id, academic_year, grade) WHERE school_id IS NOT NULL
          DO UPDATE SET
            annual_fee = EXCLUDED.annual_fee,
            annual_admission_split = EXCLUDED.annual_admission_split,
            annual_may_split = EXCLUDED.annual_may_split,
            term1_fee = EXCLUDED.term1_fee,
            term1_early_bird = EXCLUDED.term1_early_bird,
            term1_due_date = EXCLUDED.term1_due_date,
            term2_fee = EXCLUDED.term2_fee,
            term2_early_bird = EXCLUDED.term2_early_bird,
            term2_due_date = EXCLUDED.term2_due_date,
            total_installments = EXCLUDED.total_installments,
            total_early_installments = EXCLUDED.total_early_installments,
            lump_sum_fee = EXCLUDED.lump_sum_fee,
            lump_sum_early_bird = EXCLUDED.lump_sum_early_bird,
            notes = EXCLUDED.notes,
            admission_requirements = EXCLUDED.admission_requirements,
            updated_at = NOW();
        `, [
          chinchwadId, item.grade, item.annual_fee, item.annual_admission_split, item.annual_may_split,
          item.term1_fee, item.term1_early_bird, item.term1_due_date, item.term2_fee, item.term2_early_bird, item.term2_due_date,
          item.total_installments, item.total_early_installments, item.lump_sum_fee, item.lump_sum_early_bird,
          standardNotes, standardRequirements
        ]);
      }
      console.log('✅ Chinchwad branch fee structures seeded.');
    }

    console.log('🎉 Setup completed successfully!');
  } catch (err) {
    console.error('Error during setup:', err);
  } finally {
    await pool.end();
  }
}

setup();
