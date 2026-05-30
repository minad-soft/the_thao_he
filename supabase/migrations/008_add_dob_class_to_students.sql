-- Add dob and class_name to students table
ALTER TABLE public.students 
ADD COLUMN dob DATE,
ADD COLUMN class_name VARCHAR(100);
