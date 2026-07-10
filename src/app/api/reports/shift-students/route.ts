import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shiftIdsParam = searchParams.get("shiftIds");
    
    if (!shiftIdsParam) {
      return NextResponse.json({ error: "Missing shiftIds" }, { status: 400 });
    }

    const shiftIds = shiftIdsParam.split(",").filter(id => id.trim() !== "");

    if (shiftIds.length === 0) {
      return NextResponse.json([]);
    }

    // Bước 1: Lấy danh sách student_id từ bảng student_preferred_shifts
    const { data: prefData, error: prefError } = await supabaseAdmin
      .from('student_preferred_shifts')
      .select('shift_id, student_id')
      .in('shift_id', shiftIds);

    if (prefError) {
      console.error('Step 1 - prefError:', JSON.stringify(prefError));
      return NextResponse.json({ error: `Lỗi bước 1: ${prefError.message}` }, { status: 500 });
    }

    if (!prefData || prefData.length === 0) {
      return NextResponse.json([]);
    }

    // Lọc bỏ student_id null/undefined
    const studentIds = [...new Set(prefData.map(p => p.student_id).filter(Boolean))];

    if (studentIds.length === 0) {
      return NextResponse.json([]);
    }

    // Bước 2: Lấy thông tin chi tiết học viên
    const { data: studentsData, error: stuError } = await supabaseAdmin
      .from('students')
      .select('id, full_name, status, school_id')
      .in('id', studentIds);

    if (stuError) {
      console.error('Step 2 - stuError:', JSON.stringify(stuError));
      return NextResponse.json({ error: `Lỗi bước 2: ${stuError.message}` }, { status: 500 });
    }

    // Bước 3: Lấy tên trường học
    const schoolIds = [...new Set((studentsData || []).map(s => s.school_id).filter(Boolean))];
    let schoolMap: Record<string, string> = {};

    if (schoolIds.length > 0) {
      const { data: schoolsData } = await supabaseAdmin
        .from('schools')
        .select('id, school_name')
        .in('id', schoolIds);

      if (schoolsData) {
        schoolsData.forEach((s: any) => {
          schoolMap[s.id] = s.school_name;
        });
      }
    }

    // Bước 4: Ghép dữ liệu
    const formattedData = prefData
      .map(pref => {
        const student = (studentsData || []).find(s => s.id === pref.student_id);
        if (!student) return null;
        return {
          shift_id: pref.shift_id,
          student_id: student.id,
          full_name: student.full_name,
          status: student.status,
          school_name: schoolMap[student.school_id] || "Khác"
        };
      })
      .filter(Boolean);

    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error('Error fetching shift students:', error);
    return NextResponse.json({ error: error.message || "Lỗi hệ thống" }, { status: 500 });
  }
}
