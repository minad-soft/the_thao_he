-- Thêm cột quản lý cấp thẻ và phiếu thu vào bảng registrations
ALTER TABLE public.registrations
ADD COLUMN is_card_issued BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN card_reissue_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN receipt_number VARCHAR(100);
