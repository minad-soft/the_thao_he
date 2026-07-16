import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const checkinLogId = id;

  if (!checkinLogId) {
    return NextResponse.json({ error: "Thiếu ID lượt check-in" }, { status: 400 });
  }

  // 1. Fetch the checkin log
  const { data: log, error: logErr } = await supabaseAdmin
    .from("checkin_logs")
    .select("*")
    .eq("id", checkinLogId)
    .single();

  if (logErr || !log) {
    return NextResponse.json({ error: "Không tìm thấy lượt check-in" }, { status: 404 });
  }

  // 2. Fetch the registration
  const { data: registration, error: regErr } = await supabaseAdmin
    .from("registrations")
    .select("*")
    .eq("id", log.registration_id)
    .single();

  if (regErr || !registration) {
    return NextResponse.json({ error: "Không tìm thấy thông tin đăng ký" }, { status: 404 });
  }

  // 3. Revert remaining sessions (add 1)
  const newRemainingSessions = (registration.remaining_sessions || 0) + 1;
  const newStatus = registration.status === "EXPIRED" && newRemainingSessions > 0 ? "ACTIVE" : registration.status;

  const { error: updateErr } = await supabaseAdmin
    .from("registrations")
    .update({
      remaining_sessions: newRemainingSessions,
      status: newStatus
    })
    .eq("id", registration.id);

  if (updateErr) {
    return NextResponse.json({ error: "Lỗi khi hoàn buổi học: " + updateErr.message }, { status: 500 });
  }

  // 4. Delete the checkin log
  const { error: delErr } = await supabaseAdmin
    .from("checkin_logs")
    .delete()
    .eq("id", checkinLogId);

  if (delErr) {
    // If delete fails, it's problematic as sessions are already added. Ideally this would be an RPC transaction.
    // However, following the existing pattern we return the error.
    return NextResponse.json({ error: "Lỗi xóa log check-in: " + delErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Đã hủy check-in và hoàn 1 buổi học." });
}
