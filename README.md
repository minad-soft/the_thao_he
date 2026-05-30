# 🚀 Antigravity Project Blueprint: Summer Sports Manager (SSM)

**Ngày khởi tạo:** 2026-05-30[cite: 1]
**Trạng thái:** 🟢 Planning / Khởi tạo[cite: 1]
**Mô tả ngắn gọn:** Webapp Serverless (Supabase + Vercel) quản lý toàn diện quy trình ghi danh, xếp lịch huấn luyện viên, điểm danh (Check-in QR) và báo cáo doanh thu cho các khóa học thể thao hè.[cite: 1]

## 🎯 1. Mục tiêu dự án (Objectives)
* **Mục tiêu chính:** Số hóa 100% quy trình ghi danh thủ công; tự động hóa việc gán mã thẻ/mã học viên; vận hành điểm danh mượt mà bằng máy quét mã vạch và vé QR.[cite: 1]
* **Đầu ra kỳ vọng (Deliverables):**[cite: 1]
  * Hệ thống Webapp Dashboard với tốc độ phản hồi Real-time.
  * Database chuẩn hóa trên PostgreSQL (Supabase) an toàn tuyệt đối qua RLS.
  * Tài liệu Module Map để bảo trì.

## 🤖 2. Hệ sinh thái AI Agents (Agent Roster)

| Tên Agent | Vai trò (Role) | Nhiệm vụ chính (Tasks) | Công cụ cấp phép (Tools) |
| :--- | :--- | :--- | :--- |
| **User_Proxy** | Điều phối viên | Nhận yêu cầu từ người dùng, phân phối task, quản lý tài liệu.[cite: 1] | `input_reader`, `antigravity_router`[cite: 1] |
| **Backend_Logic** | Kỹ sư Backend | Viết schema PostgreSQL, RLS, và Vercel Functions (logic check-in, auto-generate mã).[cite: 1] | `python_executor`, `sql_generator`[cite: 1] |
| **Frontend_UI** | Kỹ sư Frontend | Xây dựng UI/UX (React/Next.js), kết nối Supabase Client, xử lý sự kiện quét mã vạch.[cite: 1] | `react_vue_generator`, `ui_components`[cite: 1] |
| **Data_Handler** | Chuyên gia Dữ liệu | Xử lý logic Bulk Insert từ Excel, chuẩn hóa dữ liệu.[cite: 1] | `excel_parser`, `json_parser`[cite: 1] |
| **Reviewer_QA** | Kiểm duyệt viên | Kiểm tra Row Level Security (RLS) và logic đối soát doanh thu.[cite: 1] | `quality_check_rules`[cite: 1] |

## 🔄 3. Luồng hoạt động (Agent Workflow)

1.  **Bước 1 (Input):** Người dùng yêu cầu tính năng qua `User_Proxy`.[cite: 1]
2.  **Bước 2 (Processing):** `User_Proxy` gọi `Backend_Logic` thiết kế hoặc cập nhật Schema Supabase / API.[cite: 1]
3.  **Bước 3 (Generation):** `Frontend_UI` nhận context để tạo UI Component tương ứng.[cite: 1]
4.  **Bước 4 (Review):** `Reviewer_QA` kiểm thử bảo mật và luồng logic trước khi merge code.[cite: 1]

## 🛠️ 4. Tài nguyên & Biến môi trường cần thiết
* **Tech Stack:** React/Next.js (Frontend), Supabase (PostgreSQL, Auth), Vercel (Hosting & Serverless Functions), GitHub (CI/CD).
* **API Keys (Cần cung cấp trong `.env`):**
  * `NEXT_PUBLIC_SUPABASE_URL`
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  * `SUPABASE_SERVICE_ROLE_KEY` (Chỉ dùng trên Server/Vercel)[cite: 1]

## 📅 5. Kế hoạch triển khai (Phases)
- [ ] **Phase 1:** Setup môi trường Github, Vercel, Supabase và tạo schema Cấu hình (Settings).[cite: 1]
- [ ] **Phase 2:** Phát triển Module "Cài đặt" (Bảng giá, Trường học, Ca học).[cite: 1]
- [ ] **Phase 3:** Phát triển Module "Ghi danh" và "Import Excel" (Sinh mã tự động).[cite: 1]
- [ ] **Phase 4:** Phát triển Module "Check-in" bằng máy quét và tự động in vé QR.[cite: 1]
- [ ] **Phase 5:** Báo cáo thống kê và bàn giao.[cite: 1]