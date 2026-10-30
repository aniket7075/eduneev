-- Add missing columns and constraints for Supabase
-- 1. Add grade column to students
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS grade VARCHAR(50);

-- 4. Make all optional student fields nullable (so Add Family works without them)
ALTER TABLE students
  ALTER COLUMN date_of_birth DROP NOT NULL;

ALTER TABLE students
  ALTER COLUMN emergency_contact_name DROP NOT NULL;

ALTER TABLE students
  ALTER COLUMN emergency_contact_phone DROP NOT NULL;

-- Add missing columns to students if not present
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100);

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);

-- 2. Add grade column to fee_structures
ALTER TABLE fee_structures
  ADD COLUMN IF NOT EXISTS grade VARCHAR(100);

-- 3. Ensure email is unique in parents table
CREATE UNIQUE INDEX IF NOT EXISTS idx_parents_email
  ON parents (email);

-- Optional: add extra parent fields if not present
ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS alternative_mobile VARCHAR(20),
  ADD COLUMN IF NOT EXISTS address TEXT;

-- Optional: trigger to update updated_at on leave_applications
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leave_applications_updated_at ON leave_applications;
CREATE TRIGGER update_leave_applications_updated_at
BEFORE UPDATE ON leave_applications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
