import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { signJWT } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const { fullName, dob } = await req.json();

    if (!fullName || !dob) {
      return NextResponse.json(
        { error: "Vui lòng nhập họ tên và ngày sinh" },
        { status: 400 }
      );
    }

    // Format dob from DDMMYYYY to YYYY-MM-DD for database query if needed,
    // or just query directly if dob is stored as string.
    // Wait, let's check how dob is stored. It's DATE type in DB.
    // So DDMMYYYY -> YYYY-MM-DD
    let formattedDob = dob;
    if (dob.length === 8) {
      const day = dob.substring(0, 2);
      const month = dob.substring(2, 4);
      const year = dob.substring(4, 8);
      formattedDob = `${year}-${month}-${day}`;
    }

    // 1. Tìm học viên theo tên và ngày sinh
    const { data: students, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id, full_name, sports_preference")
      .ilike("full_name", fullName)
      .eq("dob", formattedDob);

    if (studentError) {
      console.error("Lỗi truy vấn học viên:", studentError);
      return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
    }

    if (!students || students.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy học viên với thông tin này" },
        { status: 404 }
      );
    }

    // Có thể có nhiều người trùng tên/ngày sinh (hiếm), lấy người đầu tiên
    const student = students[0];

    // 2. Kiểm tra xem học viên đã ghi danh chưa
    const { data: registrations, error: regError } = await supabaseAdmin
      .from("registrations")
      .select("id")
      .eq("student_id", student.id)
      .limit(1);

    if (regError) {
      console.error("Lỗi truy vấn ghi danh:", regError);
      return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
    }

    if (!registrations || registrations.length === 0) {
      return NextResponse.json(
        { error: "Học viên chưa ghi danh bất kỳ khóa học nào" },
        { status: 403 }
      );
    }

    // 3. Tạo token (phiên làm việc)
    const token = await signJWT({ 
      studentId: student.id, 
      fullName: student.full_name,
      role: 'STUDENT'
    });

    const response = NextResponse.json({ 
      message: "Đăng nhập thành công",
      student: {
        id: student.id,
        fullName: student.full_name,
        sportsPreference: student.sports_preference
      }
    });

    // 4. Lưu cookie
    response.cookies.set("student_portal_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 tuần
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Lỗi đăng nhập học viên:", error);
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  }
}
