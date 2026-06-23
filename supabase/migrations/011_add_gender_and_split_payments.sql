-- Add gender column to students table
ALTER TABLE public.students 
ADD COLUMN gender VARCHAR(20);

-- Add amount_paid and debt_amount to registrations table
ALTER TABLE public.registrations
ADD COLUMN amount_paid DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN debt_amount DECIMAL(15, 2) DEFAULT 0.00;

-- Create registration_payments table for split payments
CREATE TABLE public.registration_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.registration_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Allow authenticated read registration_payments" ON public.registration_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert registration_payments" ON public.registration_payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update registration_payments" ON public.registration_payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete registration_payments" ON public.registration_payments FOR DELETE TO authenticated USING (true);

-- Data Migration for existing records:
-- 1. Update registrations set amount_paid = package price, debt_amount = 0
UPDATE public.registrations r
SET 
  amount_paid = p.price,
  debt_amount = 0.00
FROM public.pricing_packages p
WHERE r.package_id = p.id;

-- 2. Populate registration_payments for existing records
INSERT INTO public.registration_payments (registration_id, payment_method_id, amount, created_at)
SELECT r.id, r.payment_method_id, p.price, r.created_at
FROM public.registrations r
JOIN public.pricing_packages p ON r.package_id = p.id
WHERE r.payment_method_id IS NOT NULL;
