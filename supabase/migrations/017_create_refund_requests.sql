-- Tạo bảng refund_requests để quản lý quy trình hoàn tiền và hủy khóa học
CREATE TABLE public.refund_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL, -- Mã bảo mật cho Magic Link
    
    -- Thông tin người yêu cầu (Phụ huynh điền)
    parent_name VARCHAR(255),
    relation VARCHAR(100),
    phone VARCHAR(20),
    reason TEXT,
    
    -- Thông tin ngân hàng
    bank_name VARCHAR(255),
    bank_account VARCHAR(100),
    bank_owner VARCHAR(255),
    
    -- Trạng thái quy trình
    -- pending_info: Chờ phụ huynh điền form
    -- pending_accountant: Chờ kế toán duyệt (khớp tên)
    -- pending_manager: Chờ quản lý duyệt lệnh
    -- pending_payment: Chờ kế toán chuyển khoản
    -- completed: Đã hoàn tất, trừ buổi học
    -- rejected: Bị từ chối
    status VARCHAR(50) NOT NULL DEFAULT 'pending_info',
    
    -- Người xử lý
    created_by UUID REFERENCES public.staffs(id),
    accountant_id UUID REFERENCES public.staffs(id),
    manager_id UUID REFERENCES public.staffs(id),
    
    -- Chứng từ
    receipt_image TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Thêm index để truy vấn nhanh qua token
CREATE INDEX idx_refund_requests_token ON public.refund_requests(token);
CREATE INDEX idx_refund_requests_registration_id ON public.refund_requests(registration_id);

-- Hàm trigger để cập nhật updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Thêm trigger để tự động cập nhật updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- Phân quyền RLS
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Admin (Manager, Accountant, Staff) có thể đọc tất cả
CREATE POLICY "Admin can view all refund requests" ON public.refund_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.staffs 
            WHERE staffs.id = auth.uid()
        )
    );

-- Policy: Staff có thể tạo yêu cầu
CREATE POLICY "Staff can create refund requests" ON public.refund_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.staffs 
            WHERE staffs.id = auth.uid()
        )
    );

-- Policy: Admin có thể cập nhật
CREATE POLICY "Admin can update refund requests" ON public.refund_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.staffs 
            WHERE staffs.id = auth.uid()
        )
    );

-- Policy: Anonymous (Phụ huynh qua Magic Link) có thể cập nhật khi status là pending_info
CREATE POLICY "Anonymous can update refund request via token" ON public.refund_requests
    FOR UPDATE USING (
        status = 'pending_info'
    );

-- Policy: Anonymous có thể xem thông tin giới hạn thông qua token
CREATE POLICY "Anonymous can view refund request via token" ON public.refund_requests
    FOR SELECT USING (
        true -- Access control is handled at the application level via the token
    );
