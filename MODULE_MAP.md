# 🗺️ Module Map & Directory Structure

Cấu trúc thư mục chuẩn của dự án. Khi có yêu cầu sửa tính năng, Agents hãy tra cứu bảng này để biết vị trí file.

## 📂 Root Structure (Next.js App Router)
```text
/
├── /src
│   ├── /app                  # Pages & Routing
│   ├── /components           # UI Components dùng chung (Buttons, Tables, Modals)
│   ├── /hooks                # Custom React Hooks
│   ├── /lib                  # Utilities & Supabase Client setup
│   ├── /modules              # CÁC MODULE NGHIỆP VỤ CHÍNH (Xem bên dưới)
│   └── /types                # TypeScript definitions & Database Types
├── /supabase
│   ├── /migrations           # Chứa các file SQL khởi tạo/cập nhật Database
│   └── seed.sql              # Dữ liệu mẫu (mock data)
└── /api (hoặc app/api)       # Vercel Serverless Functions

Tên Module,Vị trí (/src/modules/...),Chức năng & File cốt lõi
Settings,/settings,"Quản lý Pricing, Schools (Trường học), Shifts (Ca học)."
Auth,/auth,"Đăng nhập hệ thống, Phân quyền Roles (Admin/Staff)."
Registration,/registration,"Form ghi danh (RegistrationForm.tsx), Logic chọn trường khác."
Students,/students,"Bảng danh sách học viên, Logic Import Excel (ExcelUploader.tsx)."
Check-in,/checkin,"Màn hình BarcodeScanner.tsx, Logic render mã QR vé cổng QRTicket.tsx."
Coaches,/coaches,Bảng hiển thị thông tin và Lịch ca dạy của Huấn luyện viên.
Reports,/reports,"Dashboard thống kê, Biểu đồ doanh thu, Lượt check-in."