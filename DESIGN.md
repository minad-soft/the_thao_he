# 🏛️ System Design & Business Rules

## 1. Kiến trúc tổng thể (Architecture)
Hệ thống sử dụng kiến trúc Serverless:
- **Client-side:** Giao tiếp trực tiếp với Supabase cho các tác vụ READ đơn giản thông qua `supabase-js`.
- **Server-side (Vercel Functions/Supabase Edge Functions):** Xử lý các tác vụ WRITE phức tạp hoặc cần bảo mật (Check-in, tính tiền, tạo mã thẻ).

## 2. Quy tắc Nghiệp vụ (Business Rules)

### A. Logic Sinh Mã (Mã Thẻ & Mã Học Viên)
- **Mã học viên:** Hệ thống tự sinh (Auto-increment hoặc UUID) không cho phép sửa đổi.
- **Mã thẻ:** Tuân thủ quy tắc `HE26<MÃ TRƯỜNG><MÃ NGẪU NHIÊN 6 KÝ TỰ>`.
  - Nếu học sinh chọn "Trường khác": Mã trường mặc định là `99`. Bắt buộc phải điền trường `Tên trường khác` và `Ghi chú học viên` (học chung với ai).
- **Tính duy nhất (Uniqueness):** Bắt buộc có `UNIQUE CONSTRAINT` trên database cho cột `MaThe`.

### B. Logic Bảng Giá & Ghi Danh
- Nhân viên không được phép nhập giá thủ công. Giá được truy xuất từ bảng `Pricing_Packages` dựa trên `Tên gói` và `Môn học`.
- Gói học bao gồm: Tên gói, Môn học, Giá tiền, Số buổi (int), Loại thời hạn (Tháng/Khoảng thời gian), Tùy chọn In vé (Boolean).

### C. Logic Check-in & In Vé (Real-time)
- **Giao diện:** Input form luôn ở trạng thái `focused`. Máy quét mã vạch sẽ nhập chuỗi và tự trigger sự kiện `onSubmit`.
- **Backend Transaction:**
  1. Nhận Mã thẻ -> Kiểm tra trạng thái gói học (Còn hạn/Còn buổi).
  2. Nếu OK -> Trừ 1 buổi (cập nhật DB).
  3. Generate mã vé cổng: `HE26` + `8 ký tự ngẫu nhiên`. Kiểm tra chống trùng lặp (Collision check).
  4. Lưu log vào `Checkin_Logs`.
  5. Trả về mã vé để Frontend trigger máy in nhiệt.

### D. Logic Import Excel
- Mã thẻ bắt buộc nhập trong file Excel mẫu.
- Validation: Trùng lặp nội bộ trong file Excel VÀ trùng lặp với Database hiện tại. Lỗi ở 1 dòng sẽ dừng toàn bộ tiến trình Import.