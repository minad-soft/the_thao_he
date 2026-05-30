import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// PUT /api/shifts/[id] — Cập nhật ca học
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { shift_name, start_time, end_time, subject, subject_id, days_of_week } = body;

  const { data, error } = await supabaseAdmin
    .from("shifts")
    .update({
      shift_name,
      start_time,
      end_time,
      subject,
      subject_id: subject_id ?? null,
      days_of_week,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/shifts/[id] — Xóa ca học
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("shifts")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
