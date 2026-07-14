-- 019_update_refund_requests_offline.sql
-- Chuyển đổi quy trình hoàn tiền sang offline, bỏ bắt buộc token
-- Thêm các cột theo dõi số tiền và phương thức hoàn

ALTER TABLE public.refund_requests
  ALTER COLUMN token DROP NOT NULL;

-- Xóa constraint UNIQUE của token nếu có (thường được đặt tên tự động là refund_requests_token_key)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'refund_requests_token_key'
  ) THEN
    ALTER TABLE public.refund_requests DROP CONSTRAINT refund_requests_token_key;
  END IF;
END $$;

ALTER TABLE public.refund_requests
  ADD COLUMN IF NOT EXISTS amount_refunded NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_method VARCHAR(50);
