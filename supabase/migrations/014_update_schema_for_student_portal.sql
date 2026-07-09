-- Migration 014: Update Schema for Student Portal (Subject Registration)

-- 1. Add sports_preference to students table
ALTER TABLE public.students 
ADD COLUMN sports_preference TEXT;

-- 2. Add location to subjects table
ALTER TABLE public.subjects 
ADD COLUMN location VARCHAR(255);

-- 3. Add start_date and end_date to shifts table
ALTER TABLE public.shifts 
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE;
