-- Thêm cột receipt_images vào bảng registrations để lưu trữ ảnh phiếu thu dạng Base64
ALTER TABLE public.registrations
ADD COLUMN receipt_images JSONB DEFAULT '[]'::jsonb;
