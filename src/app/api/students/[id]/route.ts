import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { 
    full_name, phone_number, dob, class_name, school_id, other_school_name, notes,
    package_id, receipt_number, payment_method_id, status, remaining_sessions 
  } = body;

  // 1. Cập nhật bảng students
  const { data: studentData, error: studentError } = await supabaseAdmin
    .from("students")
    .update({ full_name, phone_number, dob, class_name, school_id, other_school_name, notes })
    .eq("id", id)
    .select()
    .single();

  if (studentError) {
    return NextResponse.json({ error: studentError.message }, { status: 500 });
  }

  // 2. Cập nhật bảng registrations (nếu có)
  const { data: registrations } = await supabaseAdmin
    .from("registrations")
    .select("id")
    .eq("student_id", id)
    .limit(1);

  if (registrations && registrations.length > 0) {
    const regId = registrations[0].id;
    const { error: regError } = await supabaseAdmin
      .from("registrations")
      .update({ package_id, receipt_number, payment_method_id, status, remaining_sessions })
      .eq("id", regId);
      
    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 });
    }
  }

  return NextResponse.json(studentData);
}

// DELETE /api/students/[id] — Xóa học viên (cascade: checkin_logs → registrations → student)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Lấy tất cả registration IDs của học viên này
  const { data: registrations } = await supabaseAdmin
    .from("registrations")
    .select("id")
    .eq("student_id", id);

  // 2. Xóa checkin_logs liên quan (nếu có registrations)
  if (registrations && registrations.length > 0) {
    const regIds = registrations.map((r) => r.id);
    const { error: checkinError } = await supabaseAdmin
      .from("checkin_logs")
      .delete()
      .in("registration_id", regIds);

    if (checkinError) {
      return NextResponse.json({ error: "Lỗi xóa lịch sử điểm danh: " + checkinError.message }, { status: 500 });
    }
  }

  // 3. Xóa registrations của học viên
  const { error: regError } = await supabaseAdmin
    .from("registrations")
    .delete()
    .eq("student_id", id);

  if (regError) {
    return NextResponse.json({ error: "Lỗi xóa ghi danh: " + regError.message }, { status: 500 });
  }

  // 4. Xóa học viên
  const { error } = await supabaseAdmin
    .from("students")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
