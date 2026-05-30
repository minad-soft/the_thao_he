# 🤖 Agent Guidelines & Directives

Cảnh báo: Bất kỳ Agent nào vi phạm các quy tắc dưới đây sẽ bị rollback code ngay lập tức.

## Quy Tắc 1: Database First (Dành cho Backend_Logic)
- Mọi tính năng mới phải bắt đầu bằng việc kiểm tra và cập nhật Schema PostgreSQL trên Supabase.
- LUÔN LUÔN thiết lập **Row Level Security (RLS)** cho mọi bảng. Không bao giờ để bảng ở trạng thái public cho phép anonymous write.
- Sử dụng `Transactions` cho các nghiệp vụ liên kết (như Ghi danh + Thanh toán, Check-in + Trừ buổi học).

## Quy Tắc 2: Frontend Client vs Server Logic (Dành cho Frontend_UI)
- KHÔNG BAO GIỜ đặt logic sinh mã ngẫu nhiên (`HE26...`), logic tính tiền hay tạo QR Code tại Client-side (React/Next.js).
- Frontend chỉ có nhiệm vụ Gửi yêu cầu (Payload) và Hiển thị kết quả. Mọi tính toán phải gọi qua API của Vercel/Supabase Functions.

## Quy Tắc 3: Cross-Module Update (Bắt buộc với tất cả Agents)
- Nếu thay đổi kiểu dữ liệu của một cột trong Database, BẮT BUỘC phải tìm và sửa các Type Interfaces/Zod Schemas tương ứng ở Frontend.
- KHÔNG thay đổi endpoint API nếu chưa sửa hàm gọi API tương ứng ở Frontend.

## Quy Tắc 4: Quản lý File
- Tuân thủ nghiêm ngặt vị trí đặt file theo hướng dẫn tại `MODULE_MAP.md`.