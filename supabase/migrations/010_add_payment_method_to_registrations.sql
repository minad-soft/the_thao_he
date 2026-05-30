-- Add payment_method_id to registrations table
ALTER TABLE public.registrations
ADD COLUMN payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL;

-- Optional: Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_registrations_payment_method_id ON public.registrations(payment_method_id);
