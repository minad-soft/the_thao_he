-- Migration 004: Add shift_id column to registrations
-- This column links a registration to a specific class (shift)

ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES shifts(id);

-- Update RLS policies if needed (example placeholder)
-- ALTER POLICY "Allow authenticated read registrations" ON registrations USING (true);
-- ALTER POLICY "Allow authenticated insert registrations" ON registrations WITH CHECK (true);
