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

    const { preference, shift_ids } = await req.json();

    if (!preference || !shift_ids || !Array.isArray(shift_ids)) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ (yêu cầu chọn ca học)" }, { status: 400 });
    }

    // Kiểm tra sức chứa các ca học
    for (const shift_id of shift_ids) {
      const { data: shiftData } = await supabaseAdmin
        .from('shifts')
        .select('capacity, shift_name')
        .eq('id', shift_id)
        .single();
        
      if (shiftData && shiftData.capacity) {
        const { data: prefData } = await supabaseAdmin
          .from('student_preferred_shifts')
          .select('student_id')
          .eq('shift_id', shift_id);
          
        if (prefData) {
          const uniqueStudents = new Set(prefData.map(p => p.student_id));
          // Không tính học viên hiện tại vào số lượng đã đăng ký (vì họ đang đăng ký/cập nhật)
          uniqueStudents.delete(payload.studentId);
          const countOtherStudents = uniqueStudents.size;
          
          if (countOtherStudents >= shiftData.capacity) {
            // Lấy lại tổng số hiện tại để hiển thị lỗi cho chuẩn
            const displayCount = uniqueStudents.size;
            return NextResponse.json({ error: `Ca học ${shiftData.shift_name} đã đầy (${displayCount}/${shiftData.capacity}). Vui lòng chọn ca khác.` }, { status: 400 });
          }
        }
      }
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

    // Xóa ca học cũ
    await supabaseAdmin
      .from("student_preferred_shifts")
      .delete()
      .eq("student_id", payload.studentId);
      
    // Thêm ca học mới
    if (shift_ids.length > 0) {
      const uniqueShiftIds = [...new Set(shift_ids as string[])];
      const shiftInserts = uniqueShiftIds.map((shiftId: string) => ({
        student_id: payload.studentId,
        shift_id: shiftId
      }));
      const { error: insertError } = await supabaseAdmin.from("student_preferred_shifts").insert(shiftInserts);
      if (insertError) {
        console.error("Lỗi lưu ca học:", insertError);
        return NextResponse.json({ error: "Lỗi hệ thống khi lưu ca học" }, { status: 500 });
      }
    }

    return NextResponse.json({ message: "Lưu nguyện vọng thành công" });
  } catch (error) {
    console.error("Lỗi lưu nguyện vọng:", error);
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  }
}
