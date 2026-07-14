import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const { data: students } = await supabaseAdmin
    .from('students')
    .select('id, full_name')
    .in('full_name', ['NGUYỄN THANH ĐỨC', 'ĐOÀN NGỌC TÂM NHƯ', 'LÊ QUỐC HÀO']);

  if (!students) return NextResponse.json({ error: "no students" });

  const studentIds = students.map(s => s.id);

  const { data: registrations } = await supabaseAdmin
    .from('registrations')
    .select('id, student_id, status, shift_id, pricing_packages(subject_id, subject)')
    .in('student_id', studentIds);

  const { data: shifts } = await supabaseAdmin
    .from('shifts')
    .select('id, shift_name, subject, subject_id')
    .ilike('shift_name', '%Lớp Nâng cao Chiều%');

  return NextResponse.json({
    students,
    registrations,
    shifts
  });
}
