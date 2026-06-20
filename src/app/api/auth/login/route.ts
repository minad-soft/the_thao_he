import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { hashPassword, signJWT } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu" },
        { status: 400 }
      );
    }

    // Truy vấn thông tin nhân viên từ Database
    const { data: staff, error: dbError } = await supabaseAdmin
      .from("staffs")
      .select("*")
      .eq("username", username.trim())
      .maybeSingle();

    if (dbError) {
      return NextResponse.json({ error: "Lỗi kết nối cơ sở dữ liệu" }, { status: 500 });
    }

    if (!staff) {
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    if (staff.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động" },
        { status: 403 }
      );
    }

    const hashedInput = await hashPassword(password);
    let isPasswordCorrect = false;
    let needsUpgrade = false;

    // So sánh mật khẩu
    if (staff.password === hashedInput) {
      isPasswordCorrect = true;
    } else if (staff.password === password) {
      // Mật khẩu trong DB đang là plaintext cũ
      isPasswordCorrect = true;
      needsUpgrade = true; // Cần nâng cấp mã hóa mật khẩu này
    }

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    // Tự động nâng cấp mật khẩu sang dạng hash nếu cần
    if (needsUpgrade) {
      try {
        await supabaseAdmin
          .from("staffs")
          .update({ password: hashedInput })
          .eq("id", staff.id);
      } catch (err) {
        console.error("Failed to upgrade password encryption for staff:", staff.id, err);
      }
    }

    // Tạo JWT Token chứa thông tin user
    const token = await signJWT({
      id: staff.id,
      full_name: staff.full_name,
      username: staff.username,
      role: staff.role,
    });

    // Cấu hình Cookie
    const isProduction = process.env.NODE_ENV === "production";
    const cookieString = `session_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax${
      isProduction ? "; Secure" : ""
    }`;

    // Tạo response và set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: staff.id,
        full_name: staff.full_name,
        username: staff.username,
        role: staff.role,
      },
    });

    response.headers.set("Set-Cookie", cookieString);
    return response;
  } catch (err) {
    console.error("Login API Error:", err);
    return NextResponse.json({ error: "Lỗi xử lý yêu cầu" }, { status: 500 });
  }
}
