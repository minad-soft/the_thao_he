-- Migration 020: Add CHECKIN role to staffs

DO $$
DECLARE constraint_name text;
BEGIN
    -- Find the check constraint on the role column
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'staffs'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%role%';

    -- Drop it if found
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE staffs DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- Add the updated constraint
ALTER TABLE staffs ADD CONSTRAINT staffs_role_check CHECK (role IN ('ADMIN', 'STAFF', 'ACCOUNTANT', 'CHECKIN'));
