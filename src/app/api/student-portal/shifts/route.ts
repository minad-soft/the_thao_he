import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verifyJWT } from "@/lib/auth-utils";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET() {
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

    // Lấy danh sách ca học
    const { data: shifts, error: shiftsError } = await supabaseAdmin
      .from('shifts')
      .select('id, shift_name, start_time, end_time, days_of_week, subject, capacity')
      .order('subject', { ascending: true })
      .order('start_time', { ascending: true });

    if (shiftsError) throw shiftsError;

    // Đếm số học viên đã đăng ký
    const { data: preferredShifts, error: prefError } = await supabaseAdmin
      .from('student_preferred_shifts')
      .select('shift_id');

    if (prefError) throw prefError;

    const counts: Record<string, number> = {};
    preferredShifts.forEach((ps: any) => {
      counts[ps.shift_id] = (counts[ps.shift_id] || 0) + 1;
    });

    const result = shifts.map(shift => ({
      ...shift,
      registered_count: counts[shift.id] || 0,
      is_full: (counts[shift.id] || 0) >= (shift.capacity ?? 30)
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching student shifts:', error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
