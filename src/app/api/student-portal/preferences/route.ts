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
        const { count } = await supabaseAdmin
          .from('student_preferred_shifts')
          .select('*', { count: 'exact', head: true })
          .eq('shift_id', shift_id);
          
        if (count !== null && count >= shiftData.capacity) {
          return NextResponse.json({ error: `Ca học ${shiftData.shift_name} đã đầy (${count}/${shiftData.capacity}). Vui lòng chọn ca khác.` }, { status: 400 });
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
      const inserts = shift_ids.map(id => ({ student_id: payload.studentId, shift_id: id }));
      const { error: insertError } = await supabaseAdmin.from("student_preferred_shifts").insert(inserts);
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
