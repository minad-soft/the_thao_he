-- Migration 003: Add Checkin_Logs table
-- Bảng lưu log điểm danh và mã vé cổng

CREATE TABLE checkin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES registrations(id) NOT NULL,
    card_code VARCHAR(50) NOT NULL,
    ticket_code VARCHAR(50) NOT NULL UNIQUE, -- Format: HE26 + 8 ký tự ngẫu nhiên
    sessions_before INT NOT NULL,
    sessions_after INT NOT NULL,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE checkin_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (authenticated users only)
CREATE POLICY "Allow authenticated read checkin_logs" ON checkin_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert checkin_logs" ON checkin_logs FOR INSERT TO authenticated WITH CHECK (true);
