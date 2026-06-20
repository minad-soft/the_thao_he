import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/auth-utils";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Loại trừ các tài nguyên tĩnh, API xác thực và hình ảnh để tránh vòng lặp redirect
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.includes("favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Lấy token từ cookies
  const token = request.cookies.get("session_token")?.value;

  // Xác thực token
  const user = token ? await verifyJWT(token) : null;

  // 2. Xử lý khi truy cập vào trang Đăng nhập (/login)
  if (pathname === "/login") {
    if (user) {
      // Đã đăng nhập, chuyển hướng về trang chủ
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Chưa đăng nhập, cho tiếp tục vào trang /login
    return NextResponse.next();
  }

  // 3. Xử lý các trang nghiệp vụ khác (cần bảo vệ)
  if (!user) {
    // Chưa đăng nhập, chuyển hướng về trang /login
    const redirectUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      // Nếu không phải trang chủ, có thể lưu query param để tự động redirect lại sau (nếu muốn)
      // Ở đây ta có thể hiển thị cảnh báo session hết hạn
      redirectUrl.searchParams.set("error", "session_expired");
    }
    return NextResponse.redirect(redirectUrl);
  }

  // 4. Phân quyền truy cập dựa trên vai trò (Role-based Authorization)
  const userRole = user.role;

  // Trang Quản lý nhân viên (/staff) và Cài đặt (/settings) -> Chỉ dành cho ADMIN
  if (pathname.startsWith("/staff") || pathname.startsWith("/settings")) {
    if (userRole !== "ADMIN") {
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Trang Báo cáo thống kê (/reports) -> Chỉ dành cho ADMIN và ACCOUNTANT
  if (pathname.startsWith("/reports")) {
    if (userRole !== "ADMIN" && userRole !== "ACCOUNTANT") {
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Bảo vệ các API nghiệp vụ (chỉ cho phép gọi API khi đã đăng nhập)
  if (pathname.startsWith("/api/")) {
    // Vì Middleware chạy trước cả API Routes nên chúng ta có thể chặn các API Routes nhạy cảm từ client
    // Ví dụ chặn /api/staffs và /api/settings nếu không phải ADMIN
    if (pathname.startsWith("/api/staffs") || pathname.startsWith("/api/settings")) {
      if (userRole !== "ADMIN") {
        return NextResponse.json({ error: "Không được phép thực hiện" }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

// Chỉ chạy middleware trên các đường dẫn cụ thể
export const config = {
  matcher: [
    /*
     * Khớp với tất cả các request ngoại trừ:
     * - api/auth/login, api/auth/logout
     * - các file tĩnh (_next/static, _next/image, favicon.ico)
     */
    "/((?!api/auth/login|api/auth/logout|_next/static|_next/image|favicon.ico).*)",
  ],
};
