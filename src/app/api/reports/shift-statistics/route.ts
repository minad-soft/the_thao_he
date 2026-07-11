import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Lấy tất cả ca học kèm thông tin môn học
    const { data: shifts, error: shiftsError } = await supabaseAdmin
      .from('shifts')
      .select(`
        *,
        subjects:subject_id (
          subject_name
        )
      `)
      .order('subject', { ascending: true })
      .order('start_time', { ascending: true });

    if (shiftsError) throw shiftsError;

    // Lấy số lượng đăng ký cho mỗi ca
    const { data: preferredShifts, error: prefError } = await supabaseAdmin
      .from('student_preferred_shifts')
      .select('shift_id, student_id');

    if (prefError) throw prefError;

    // Đếm số lượng (bỏ qua trùng lặp)
    const counts: Record<string, number> = {};
    const seen = new Set<string>();
    preferredShifts.forEach((ps: any) => {
      if (ps.student_id) {
        const key = `${ps.shift_id}_${ps.student_id}`;
        if (!seen.has(key)) {
          seen.add(key);
          counts[ps.shift_id] = (counts[ps.shift_id] || 0) + 1;
        }
      }
    });

    // Gom nhóm theo môn học
    const result: Record<string, any[]> = {};
    
    shifts.forEach((shift: any) => {
      const subjectName = shift.subjects?.subject_name || shift.subject;
      if (!result[subjectName]) {
        result[subjectName] = [];
      }
      
      result[subjectName].push({
        ...shift,
        registered_count: counts[shift.id] || 0
      });
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching shift statistics:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
