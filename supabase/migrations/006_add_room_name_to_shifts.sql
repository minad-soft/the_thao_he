-- Migration 006: Add room_name column to shifts table
-- Bổ sung thông tin phòng học cho ca học

ALTER TABLE shifts
ADD COLUMN room_name VARCHAR(255) NULL;

-- Grant policy to allow reading room_name (already covered by existing policies)

-- No need to change RLS policies as they use USING (true)
