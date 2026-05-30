-- Create Schools table
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name VARCHAR(255) NOT NULL,
    school_code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default school for 'Other'
INSERT INTO schools (school_name, school_code) VALUES ('Trường khác', '99');

-- Create Pricing_Packages table
CREATE TABLE pricing_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    sessions_count INT NOT NULL,
    duration_type VARCHAR(50) NOT NULL, -- e.g., 'Month', 'Period'
    print_ticket BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    school_id UUID REFERENCES schools(id),
    other_school_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Registrations table
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) NOT NULL,
    package_id UUID REFERENCES pricing_packages(id) NOT NULL,
    card_code VARCHAR(50) NOT NULL UNIQUE, -- Format: HE26<MÃ TRƯỜNG><MÃ NGẪU NHIÊN 6 KÝ TỰ>
    status VARCHAR(50) DEFAULT 'ACTIVE',
    remaining_sessions INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Allow authenticated users only, restrict anonymous)

-- Schools Policies
CREATE POLICY "Allow authenticated read schools" ON schools FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert schools" ON schools FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update schools" ON schools FOR UPDATE TO authenticated USING (true);

-- Pricing_Packages Policies
CREATE POLICY "Allow authenticated read pricing_packages" ON pricing_packages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert pricing_packages" ON pricing_packages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update pricing_packages" ON pricing_packages FOR UPDATE TO authenticated USING (true);

-- Students Policies
CREATE POLICY "Allow authenticated read students" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert students" ON students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update students" ON students FOR UPDATE TO authenticated USING (true);

-- Registrations Policies
CREATE POLICY "Allow authenticated read registrations" ON registrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert registrations" ON registrations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update registrations" ON registrations FOR UPDATE TO authenticated USING (true);
