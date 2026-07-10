// Script kiểm tra và dọn dẹp dữ liệu mồ côi trong student_preferred_shifts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Lấy tất cả records trong student_preferred_shifts
    const { data: allPrefs, error: prefError } = await supabaseAdmin
      .from('student_preferred_shifts')
      .select('shift_id, student_id');

    if (prefError) throw prefError;

    if (!allPrefs || allPrefs.length === 0) {
      return NextResponse.json({ message: "Bảng student_preferred_shifts rỗng.", total: 0, orphans: 0 });
    }

    // 2. Lấy tất cả student IDs thực sự tồn tại
    const studentIds = [...new Set(allPrefs.map(p => p.student_id))];
    const { data: existingStudents, error: stuError } = await supabaseAdmin
      .from('students')
      .select('id, full_name, sports_preference')
      .in('id', studentIds);

    if (stuError) throw stuError;

    // 3. Tìm records mồ côi:
    //    a) student_id không tồn tại trong bảng students
    //    b) student tồn tại nhưng sports_preference đã bị xóa trống
    const existingStudentMap = new Map();
    (existingStudents || []).forEach(s => existingStudentMap.set(s.id, s));

    const orphanRecords: any[] = [];
    allPrefs.forEach(pref => {
      const student = existingStudentMap.get(pref.student_id);
      if (!student) {
        orphanRecords.push({ ...pref, reason: "Student không tồn tại" });
      } else if (!student.sports_preference || student.sports_preference.trim() === "") {
        orphanRecords.push({ ...pref, reason: "Student đã xóa nguyện vọng", student_name: student.full_name });
      }
    });

    return NextResponse.json({
      total_preferred_shifts: allPrefs.length,
      orphan_count: orphanRecords.length,
      valid_count: allPrefs.length - orphanRecords.length,
      orphans: orphanRecords,
      all_records: allPrefs.map(p => {
        const student = existingStudentMap.get(p.student_id);
        return {
          shift_id: p.shift_id,
          student_id: p.student_id,
          student_name: student?.full_name || "KHÔNG TỒN TẠI",
          sports_preference: student?.sports_preference || "TRỐNG"
        };
      })
    });
  } catch (error: any) {
    console.error('Cleanup check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Thực hiện xóa dữ liệu mồ côi
export async function POST() {
  try {
    // 1. Lấy tất cả records
    const { data: allPrefs, error: prefError } = await supabaseAdmin
      .from('student_preferred_shifts')
      .select('shift_id, student_id');

    if (prefError) throw prefError;
    if (!allPrefs || allPrefs.length === 0) {
      return NextResponse.json({ message: "Không có dữ liệu cần dọn.", deleted: 0 });
    }

    const studentIds = [...new Set(allPrefs.map(p => p.student_id))];
    const { data: existingStudents } = await supabaseAdmin
      .from('students')
      .select('id, sports_preference')
      .in('id', studentIds);

    const existingStudentMap = new Map();
    (existingStudents || []).forEach(s => existingStudentMap.set(s.id, s));

    // 2. Tìm student_id cần xóa
    const studentIdsToClean: string[] = [];
    const processedIds = new Set<string>();
    
    allPrefs.forEach(pref => {
      if (processedIds.has(pref.student_id)) return;
      processedIds.add(pref.student_id);
      
      const student = existingStudentMap.get(pref.student_id);
      if (!student || !student.sports_preference || student.sports_preference.trim() === "") {
        studentIdsToClean.push(pref.student_id);
      }
    });

    // 3. Xóa
    let deletedCount = 0;
    if (studentIdsToClean.length > 0) {
      const { error: delError, count } = await supabaseAdmin
        .from('student_preferred_shifts')
        .delete()
        .in('student_id', studentIdsToClean);

      if (delError) throw delError;
      deletedCount = count || studentIdsToClean.length;
    }

    return NextResponse.json({
      message: `Đã dọn dẹp ${deletedCount} records mồ côi.`,
      deleted: deletedCount,
      cleaned_student_ids: studentIdsToClean
    });
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
