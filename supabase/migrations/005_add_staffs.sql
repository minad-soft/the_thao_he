-- Migration 005: Add Staffs table
-- Bảng tài khoản nhân viên vận hành hệ thống

CREATE TABLE staffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'STAFF' CHECK (role IN ('ADMIN', 'STAFF', 'ACCOUNTANT')),
    password VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE staffs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (authenticated users only)
CREATE POLICY "Allow authenticated read staffs" ON staffs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert staffs" ON staffs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update staffs" ON staffs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete staffs" ON staffs FOR DELETE TO authenticated USING (true);

-- Seed tài khoản mặc định phục vụ chạy thử và kiểm tra
INSERT INTO staffs (full_name, username, phone_number, role, password, status) VALUES
  ('Quản trị hệ thống', 'admin', '0901234567', 'ADMIN', 'admin123', 'ACTIVE'),
  ('Kế toán trưởng', 'ketoan', '0907654321', 'ACCOUNTANT', 'ketoan123', 'ACTIVE')
ON CONFLICT (username) DO NOTHING;
