import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shiftId } = await params;

    // Lấy thông tin ca học
    const { data: shift, error: shiftErr } = await supabaseAdmin
      .from('shifts')
      .select('subject, subject_id')
      .eq('id', shiftId)
      .single();

    if (shiftErr || !shift) {
      return NextResponse.json({ error: "Không tìm thấy ca học" }, { status: 404 });
    }

    // Lấy danh sách student_id từ student_preferred_shifts
    const { data: prefData } = await supabaseAdmin
      .from('student_preferred_shifts')
      .select('student_id')
      .eq('shift_id', shiftId);

    let studentIds = (prefData || []).map(p => p.student_id).filter(Boolean);
    studentIds = [...new Set(studentIds)];

    if (studentIds.length === 0) {
      return NextResponse.json([]);
    }

    // Lấy danh sách học viên
    const { data: students, error: stuErr } = await supabaseAdmin
      .from('students')
      .select('id, full_name, school_id')
      .in('id', studentIds);

    if (stuErr) throw stuErr;

    // Lấy đăng ký của học viên (không chỉ ACTIVE để biết họ có gói hay ko)
    const { data: registrations, error: regErr } = await supabaseAdmin
      .from('registrations')
      .select(`
        id, student_id, card_code, remaining_sessions, status,
        pricing_packages ( subject_id, subject )
      `)
      .in('student_id', studentIds);

    if (regErr) throw regErr;

    // Hàm so sánh môn học linh hoạt
    const isMatch = (name1: string | null | undefined, name2: string | null | undefined) => {
      if (!name1 || !name2) return false;
      const n1 = name1.toLowerCase().trim();
      const n2 = name2.toLowerCase().trim();
      if (n1 === n2) return true;
      const isBoi1 = n1 === "học bơi" || n1 === "bơi" || n1 === "bơi lội";
      const isBoi2 = n2 === "học bơi" || n2 === "bơi" || n2 === "bơi lội";
      if (isBoi1 && isBoi2) return true;
      return false;
    };

    // Ghép dữ liệu
    const result = (students || []).map(student => {
      // Tìm registration phù hợp với môn học của ca
      let reg = (registrations || []).find(r => 
        r.student_id === student.id && 
        (isMatch((r.pricing_packages as any)?.subject, shift.subject) || (r.pricing_packages as any)?.subject_id === shift.subject_id)
      );

      // Nếu không tìm thấy gói đúng môn (có thể do học chéo môn), lấy gói ACTIVE bất kỳ
      if (!reg) {
        reg = (registrations || []).find(r => r.student_id === student.id && r.status === 'ACTIVE');
      }

      // Nếu có gói nhưng PENDING, ta vẫn có thể cho check-in hoặc cảnh báo tùy nghiệp vụ.
      // Tạm thời coi ACTIVE hoặc PENDING có session > 0 là hợp lệ để checkin.
      const isValid = reg && reg.status === 'ACTIVE';

      return {
        student_id: student.id,
        full_name: student.full_name,
        card_code: reg?.card_code || "",
        registration_id: reg?.id || null,
        remaining_sessions: reg?.remaining_sessions ?? 0,
        registration_status: reg?.status || null,
        has_active_registration: !!isValid
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching shift students:', error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
