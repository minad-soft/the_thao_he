-- Migration 021: Add discount feature to registrations
ALTER TABLE public.registrations
ADD COLUMN discount_type VARCHAR(20) DEFAULT NULL,
ADD COLUMN discount_amount DECIMAL(15, 2) DEFAULT 0.00;
