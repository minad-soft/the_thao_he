import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { ShiftInsert } from "@/types/database.types";

// GET /api/shifts — Lấy danh sách ca học
export async function GET() {
  const { data: shifts, error } = await supabaseAdmin
    .from("shifts")
    .select("*")
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Đếm số học viên đã đăng ký (bỏ qua trùng lặp)
  const { data: preferredShifts, error: prefError } = await supabaseAdmin
    .from('student_preferred_shifts')
    .select('shift_id, student_id');

  if (prefError) {
    return NextResponse.json({ error: prefError.message }, { status: 500 });
  }

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

  // Lấy danh sách các phiên check-in đang diễn ra
  const { data: activeBatches, error: batchesError } = await supabaseAdmin
    .from('batch_checkins')
    .select('id, shift_id')
    .eq('status', 'IN_PROGRESS');

  const activeBatchMap: Record<string, string> = {};
  if (activeBatches) {
    activeBatches.forEach((b: any) => {
      activeBatchMap[b.shift_id] = b.id;
    });
  }

  const shiftsWithCount = shifts.map(shift => ({
    ...shift,
    enrolled_count: counts[shift.id] || 0,
    active_batch_id: activeBatchMap[shift.id] || null
  }));

  return NextResponse.json(shiftsWithCount);
}

// POST /api/shifts — Thêm ca học mới
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { shift_name, start_date, end_date, start_time, end_time, subject, subject_id, days_of_week, capacity } = body;

  if (!shift_name || !start_time || !end_time || !subject || !start_date || !end_date) {
    return NextResponse.json(
      { error: "Thiếu trường bắt buộc: shift_name, start_date, end_date, start_time, end_time, subject" },
      { status: 400 }
    );
  }

  const insertData: ShiftInsert = {
    shift_name,
    start_date: start_date || null,
    end_date: end_date || null,
    start_time,
    end_time,
    subject,
    subject_id: subject_id ?? null,
    days_of_week: days_of_week ?? [],
    capacity: capacity ?? 30,
  };

  const { data, error } = await supabaseAdmin
    .from("shifts")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
