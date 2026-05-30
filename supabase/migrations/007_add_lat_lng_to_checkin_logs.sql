-- Migration 007: Add lat and lng columns to checkin_logs table
-- Lưu vị trí GPS chi tiết cho mỗi lần check‑in

ALTER TABLE checkin_logs
ADD COLUMN lat NUMERIC NULL,
ADD COLUMN lng NUMERIC NULL;

-- No additional RLS changes needed; existing policies already allow insert for authenticated users.
