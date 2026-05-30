-- Seed Data: Dữ liệu mẫu cho phát triển và kiểm thử
-- Chạy file này trên Supabase SQL Editor sau khi đã chạy migrations

-- ==================== Schools ====================
-- Lưu ý: 'Trường khác' (mã 99) đã được tạo trong 001_initial_schema.sql
INSERT INTO schools (school_name, school_code) VALUES
  ('THPT Nguyễn Huệ', '01'),
  ('THCS Lê Quý Đôn', '02'),
  ('TH Trần Phú', '03'),
  ('THPT Chu Văn An', '04');

-- ==================== Pricing Packages ====================
INSERT INTO pricing_packages (package_name, subject, price, sessions_count, duration_type, print_ticket) VALUES
  ('Gói Tháng - Bơi Lội', 'Bơi lội', 500000, 12, 'Month', true),
  ('Gói Tháng - Bóng Rổ', 'Bóng rổ', 450000, 12, 'Month', true),
  ('Gói 10 Buổi - Bơi Lội', 'Bơi lội', 400000, 10, 'Period', false),
  ('Gói Hè - Bóng Đá', 'Bóng đá', 800000, 24, 'Period', true),
  ('Gói Tháng - Cầu Lông', 'Cầu lông', 350000, 8, 'Month', false);

-- ==================== Shifts ====================
INSERT INTO shifts (shift_name, start_time, end_time, subject, days_of_week) VALUES
  ('Ca sáng - Bơi lội', '07:00', '09:00', 'Bơi lội', ARRAY['T2','T4','T6']),
  ('Ca chiều - Bơi lội', '15:00', '17:00', 'Bơi lội', ARRAY['T3','T5','T7']),
  ('Ca sáng - Bóng rổ', '08:00', '10:00', 'Bóng rổ', ARRAY['T2','T4','T6']),
  ('Ca chiều - Bóng đá', '16:00', '18:00', 'Bóng đá', ARRAY['T3','T5','T7']);
