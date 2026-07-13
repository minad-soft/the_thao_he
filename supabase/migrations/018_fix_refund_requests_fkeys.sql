-- Fix: Đổi Foreign Key từ auth.users sang public.staffs
-- Vì hệ thống đăng nhập dùng bảng staffs, không phải auth.users

ALTER TABLE public.refund_requests
  DROP CONSTRAINT IF EXISTS refund_requests_created_by_fkey,
  DROP CONSTRAINT IF EXISTS refund_requests_accountant_id_fkey,
  DROP CONSTRAINT IF EXISTS refund_requests_manager_id_fkey;

ALTER TABLE public.refund_requests
  ADD CONSTRAINT refund_requests_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staffs(id),
  ADD CONSTRAINT refund_requests_accountant_id_fkey FOREIGN KEY (accountant_id) REFERENCES public.staffs(id),
  ADD CONSTRAINT refund_requests_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.staffs(id);
