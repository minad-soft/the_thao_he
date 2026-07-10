-- Thêm trường notes và show_notes vào bảng subjects
ALTER TABLE subjects
ADD COLUMN notes TEXT,
ADD COLUMN show_notes BOOLEAN DEFAULT false;
