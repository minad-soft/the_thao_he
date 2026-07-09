import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verifyJWT } from "@/lib/auth-utils";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("student_portal_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ" }, { status: 401 });
    }

    const { preference } = await req.json();

    if (!preference) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    }

    // Cập nhật sports_preference vào bảng students
    const { error } = await supabaseAdmin
      .from("students")
      .update({ sports_preference: preference })
      .eq("id", payload.studentId);

    if (error) {
      console.error("Lỗi cập nhật nguyện vọng:", error);
      return NextResponse.json({ error: "Lỗi hệ thống khi lưu dữ liệu" }, { status: 500 });
    }

    return NextResponse.json({ message: "Lưu nguyện vọng thành công" });
  } catch (error) {
    console.error("Lỗi lưu nguyện vọng:", error);
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  }
}
