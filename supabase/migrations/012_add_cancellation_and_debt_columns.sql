-- Thêm các trường lưu thông tin hủy và hoàn tiền vào bảng registrations
ALTER TABLE public.registrations
ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN refund_amount DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN refund_method VARCHAR(50),
ADD COLUMN refund_receipt_image TEXT,
ADD COLUMN cancellation_notes TEXT;
