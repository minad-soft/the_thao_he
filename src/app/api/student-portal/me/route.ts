import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verifyJWT } from "@/lib/auth-utils";
import { cookies } from "next/headers";

export async function GET(req: Request) {
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

    // Truy vấn thông tin học viên
    const { data: student, error } = await supabaseAdmin
      .from("students")
      .select(`
        id, 
        full_name, 
        sports_preference,
        student_preferred_shifts (
          shift_id
        )
      `)
      .eq("id", payload.studentId)
      .single();

    if (error || !student) {
      return NextResponse.json({ error: "Không tìm thấy thông tin học viên" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Lỗi lấy thông tin học viên:", error);
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  }
}
