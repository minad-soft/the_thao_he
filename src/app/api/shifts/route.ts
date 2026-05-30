import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { ShiftInsert } from "@/types/database.types";

// GET /api/shifts — Lấy danh sách ca học
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("shifts")
    .select("*")
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/shifts — Thêm ca học mới
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { shift_name, start_time, end_time, subject, subject_id, days_of_week } = body;

  if (!shift_name || !start_time || !end_time || !subject) {
    return NextResponse.json(
      { error: "Thiếu trường bắt buộc: shift_name, start_time, end_time, subject" },
      { status: 400 }
    );
  }

  const insertData: ShiftInsert = {
    shift_name,
    start_time,
    end_time,
    subject,
    subject_id: subject_id ?? null,
    days_of_week: days_of_week ?? [],
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
