-- Migration 004: Add Bank Accounts, Subjects, and Payment Methods tables
-- Also add subject_id FK to pricing_packages and shifts

-- ==================== 1. Subjects Table ====================
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(10) DEFAULT '🏀',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read subjects" ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert subjects" ON subjects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update subjects" ON subjects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete subjects" ON subjects FOR DELETE TO authenticated USING (true);

-- Populate subjects from existing data in pricing_packages and shifts
INSERT INTO subjects (subject_name)
SELECT DISTINCT subject FROM (
    SELECT subject FROM pricing_packages
    UNION
    SELECT subject FROM shifts
) AS all_subjects
WHERE subject IS NOT NULL AND subject != ''
ON CONFLICT (subject_name) DO NOTHING;

-- Add subject_id FK to pricing_packages
ALTER TABLE pricing_packages ADD COLUMN subject_id UUID REFERENCES subjects(id);

-- Update subject_id in pricing_packages from existing text data
UPDATE pricing_packages pp
SET subject_id = s.id
FROM subjects s
WHERE pp.subject = s.subject_name;

-- Add subject_id FK to shifts
ALTER TABLE shifts ADD COLUMN subject_id UUID REFERENCES subjects(id);

-- Update subject_id in shifts from existing text data
UPDATE shifts sh
SET subject_id = s.id
FROM subjects s
WHERE sh.subject = s.subject_name;

-- ==================== 2. Bank Accounts Table ====================
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name VARCHAR(255) NOT NULL,
    account_code VARCHAR(50) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_holder VARCHAR(255) NOT NULL,
    branch VARCHAR(255),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read bank_accounts" ON bank_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert bank_accounts" ON bank_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update bank_accounts" ON bank_accounts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete bank_accounts" ON bank_accounts FOR DELETE TO authenticated USING (true);

-- ==================== 3. Payment Methods Table ====================
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    method_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read payment_methods" ON payment_methods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert payment_methods" ON payment_methods FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update payment_methods" ON payment_methods FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete payment_methods" ON payment_methods FOR DELETE TO authenticated USING (true);

-- Seed some default payment methods
INSERT INTO payment_methods (method_name, description) VALUES
    ('Tiền mặt', 'Thanh toán bằng tiền mặt trực tiếp'),
    ('Chuyển khoản', 'Chuyển khoản ngân hàng'),
    ('MoMo', 'Thanh toán qua ví MoMo')
ON CONFLICT (method_name) DO NOTHING;
