-- Migration 002: Add Shifts table
-- Bảng Ca học cho module Settings

CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_name VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject VARCHAR(255) NOT NULL,
    days_of_week TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (authenticated users only)
CREATE POLICY "Allow authenticated read shifts" ON shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert shifts" ON shifts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update shifts" ON shifts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete shifts" ON shifts FOR DELETE TO authenticated USING (true);

-- Also add DELETE policies for existing tables (missed in 001)
CREATE POLICY "Allow authenticated delete schools" ON schools FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete pricing_packages" ON pricing_packages FOR DELETE TO authenticated USING (true);
