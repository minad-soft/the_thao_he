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
    pathname.startsWith("/dang-ky-mon") ||
    pathname.startsWith("/api/student-portal") ||
    pathname.includes("favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Lấy token từ cookies
  const token = request.cookies.get("session_token")?.value;

  // Xác thực token
  const user = token ? await verifyJWT(token) : null;

  if (user && user.passHash) {
    // Edge-compatible Supabase client is needed here. But wait, we can just use fetch to Supabase REST API directly to avoid importing client issues in edge.
    // Actually @supabase/supabase-js is edge compatible.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    // Quick fetch to Supabase REST API using standard fetch for minimal edge overhead
    const res = await fetch(`${supabaseUrl}/rest/v1/staffs?username=eq.${encodeURIComponent(user.username)}&select=password`, {
      headers: {
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      },
      next: { revalidate: 0 } // no cache
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const currentPassword = data[0].password;
        if (currentPassword && currentPassword.substring(0, 10) !== user.passHash) {
          // Password changed -> invalidate session
          if (pathname.startsWith("/api/")) {
            const response = NextResponse.json({ error: "Phiên đăng nhập đã hết hạn do thay đổi mật khẩu" }, { status: 401 });
            response.cookies.delete("session_token");
            return response;
          } else {
            const redirectUrl = new URL("/login", request.url);
            redirectUrl.searchParams.set("error", "session_expired");
            const response = NextResponse.redirect(redirectUrl);
            response.cookies.delete("session_token");
            return response;
          }
        }
      }
    }
  }

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
    // Nếu là API route → trả JSON 401 thay vì redirect (tránh lỗi khi client fetch)
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Phiên đăng nhập đã hết hạn" }, { status: 401 });
    }
    // Nếu là trang web → chuyển hướng về /login
    const redirectUrl = new URL("/login", request.url);
    if (pathname !== "/") {
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

  // Trang Báo cáo thống kê (/reports) -> Chỉ dành cho ADMIN, ACCOUNTANT và STAFF
  if (pathname.startsWith("/reports")) {
    if (userRole !== "ADMIN" && userRole !== "ACCOUNTANT" && userRole !== "STAFF") {
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Chặn CHECKIN truy cập các trang không thuộc phận sự
  if (pathname.startsWith("/registration") || pathname.startsWith("/students")) {
    if (userRole === "CHECKIN") {
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Bảo vệ các API nghiệp vụ (chỉ cho phép gọi API khi đã đăng nhập)
  if (pathname.startsWith("/api/")) {
    // Chặn quyền XÓA và HỦY đối với nhân viên (STAFF)
    if (userRole === "STAFF") {
      if (request.method === "DELETE") {
        return NextResponse.json({ error: "Nhân viên không có quyền xóa" }, { status: 403 });
      }
      if (pathname.includes("/cancel")) {
        return NextResponse.json({ error: "Nhân viên không có quyền hủy đăng ký" }, { status: 403 });
      }
    }

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
// Chỉ chạy middleware trên các đường dẫn cụ thể
export const config = {
  matcher: [
    /*
     * Khớp với tất cả các request ngoại trừ:
     * - api/auth/login, api/auth/logout, api/student-portal
     * - dang-ky-mon
     * - các file tĩnh (_next/static, _next/image, favicon.ico)
     */
    "/((?!api/auth/login|api/auth/logout|api/student-portal|dang-ky-mon|_next/static|_next/image|favicon.ico).*)",
  ],
};
