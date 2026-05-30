import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * Sinh mã vé cổng: HE26 + 8 ký tự ngẫu nhiên (A-Z0-9)
 * Tuân thủ DESIGN.md mục C và AGENTS.md Quy Tắc 2
 */
function generateTicketCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let random = "";
  for (let i = 0; i < 8; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HE26${random}`;
}

/**
 * POST /api/checkin — Xử lý check-in
 * Transaction theo DESIGN.md mục C:
 * 1. Nhận Mã thẻ → Kiểm tra trạng thái gói học
 * 2. Trừ 1 buổi
 * 3. Generate mã vé cổng (collision check)
 * 4. Lưu log vào checkin_logs
 * 5. Trả về mã vé
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { card_code } = body;

  if (!card_code || !card_code.trim()) {
    return NextResponse.json(
      { error: "Mã thẻ không được để trống" },
      { status: 400 }
    );
  }

  const trimmedCode = card_code.trim();

  // 1. Tìm registration theo card_code (JOIN student + package)
  const { data: registration, error: regErr } = await supabaseAdmin
    .from("registrations")
    .select(`
      *,
      students (id, full_name, phone_number),
      pricing_packages (package_name, subject, print_ticket)
    `)
    .eq("card_code", trimmedCode)
    .single();

  if (regErr || !registration) {
    return NextResponse.json(
      {
        error: "Không tìm thấy mã thẻ",
        status_type: "NOT_FOUND",
        card_code: trimmedCode,
      },
      { status: 404 }
    );
  }

  // 2. Kiểm tra trạng thái
  if (registration.status !== "ACTIVE") {
    return NextResponse.json(
      {
        error: `Gói học đã ${registration.status === "EXPIRED" ? "hết hạn" : "bị hủy"}`,
        status_type: "INACTIVE",
        student_name: registration.students?.full_name,
        card_code: trimmedCode,
      },
      { status: 400 }
    );
  }

  // 3. Kiểm tra còn buổi
  if (registration.remaining_sessions === null || registration.remaining_sessions <= 0) {
    return NextResponse.json(
      {
        error: "Đã hết buổi học. Vui lòng gia hạn gói.",
        status_type: "NO_SESSIONS",
        student_name: registration.students?.full_name,
        remaining_sessions: 0,
        card_code: trimmedCode,
      },
      { status: 400 }
    );
  }

  const sessionsBefore = registration.remaining_sessions;
  const sessionsAfter = sessionsBefore - 1;

  // 4. Trừ 1 buổi
  const { error: updateErr } = await supabaseAdmin
    .from("registrations")
    .update({
      remaining_sessions: sessionsAfter,
      status: sessionsAfter <= 0 ? "EXPIRED" : "ACTIVE",
    })
    .eq("id", registration.id);

  if (updateErr) {
    return NextResponse.json(
      { error: "Lỗi cập nhật buổi học: " + updateErr.message },
      { status: 500 }
    );
  }

  // 5. Sinh mã vé cổng (collision check, retry tối đa 5 lần)
  let ticketCode = "";
  let attempts = 0;
  while (attempts < 5) {
    ticketCode = generateTicketCode();
    const { data: existing } = await supabaseAdmin
      .from("checkin_logs")
      .select("id")
      .eq("ticket_code", ticketCode)
      .single();

    if (!existing) break;
    attempts++;
  }

  if (attempts >= 5) {
    return NextResponse.json(
      { error: "Không thể sinh mã vé duy nhất. Vui lòng thử lại." },
      { status: 500 }
    );
  }

  // 6. Lưu log
  const { error: logErr } = await supabaseAdmin
    .from("checkin_logs")
    .insert({
      registration_id: registration.id,
      card_code: trimmedCode,
      ticket_code: ticketCode,
      sessions_before: sessionsBefore,
      sessions_after: sessionsAfter,
    });

  if (logErr) {
    return NextResponse.json(
      { error: "Lỗi lưu log check-in: " + logErr.message },
      { status: 500 }
    );
  }

  // 7. Trả về kết quả
  return NextResponse.json({
    success: true,
    ticket_code: ticketCode,
    card_code: trimmedCode,
    student_name: registration.students?.full_name,
    package_name: registration.pricing_packages?.package_name,
    subject: registration.pricing_packages?.subject,
    print_ticket: registration.pricing_packages?.print_ticket,
    sessions_before: sessionsBefore,
    sessions_after: sessionsAfter,
    checked_in_at: new Date().toISOString(),
  });
}
