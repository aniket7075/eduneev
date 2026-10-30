-- ==============================================================================
-- MIGRATION: Add Missing Tables & Fix Schema
-- Run this on your Supabase/PostgreSQL instance
-- ==============================================================================

-- 1. Create leave_applications table (missing from original schema)
CREATE TABLE IF NOT EXISTS leave_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_leave_applications_student ON leave_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_leave_applications_status ON leave_applications(status);

-- 2. Create parents table if it doesn't exist (the admin controller uses this)
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE,
    contact_number VARCHAR(20) NOT NULL,
    alternative_mobile VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP INDEX IF EXISTS idx_parents_email;
CREATE UNIQUE INDEX idx_parents_email ON parents(email);

-- 3. Add missing columns to students table (if not present)
ALTER TABLE students ADD COLUMN IF NOT EXISTS grade VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 4. Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(100);

-- 5. Add missing columns to notices table (make school_id nullable)
ALTER TABLE notices ALTER COLUMN school_id DROP NOT NULL;

-- 6. Add missing columns to homework table
-- (The schema uses section_id which is correct; no changes needed)

-- 7. Add date column to notices if it doesn't exist
ALTER TABLE notices ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE notices ADD COLUMN IF NOT EXISTS audience VARCHAR(50) DEFAULT 'all';

-- 8. Add school_id nullable to transport_routes
ALTER TABLE transport_routes ALTER COLUMN school_id DROP NOT NULL;

-- 9. Add updated_at to leave_applications trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leave_applications_updated_at ON leave_applications;
CREATE TRIGGER update_leave_applications_updated_at
    BEFORE UPDATE ON leave_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Ensure parent_id in students references parents table (not users)
-- Note: If your current parent_id references users, run this carefully:
-- ALTER TABLE students DROP CONSTRAINT IF EXISTS students_parent_id_fkey;
-- ALTER TABLE students ADD CONSTRAINT students_parent_id_fkey 
--   FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE RESTRICT;

-- Done!
SELECT 'Migration completed successfully' AS status;
