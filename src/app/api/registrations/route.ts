import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * Sinh mã thẻ theo format: HE26 + school_code + 6 ký tự ngẫu nhiên (A-Z0-9)
 * Tuân thủ DESIGN.md mục A và AGENTS.md Quy Tắc 2 (sinh mã ở Server)
 */
function generateCardCode(schoolCode: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HE26${schoolCode}${random}`;
}

// GET /api/registrations — Lấy danh sách ghi danh (JOIN)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("registrations")
    .select(`
      *,
      students (*),
      pricing_packages (*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/registrations — Ghi danh mới (Transaction: Student + Registration)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { full_name, dob, class_name, phone_number, school_id, other_school_name, notes, package_id, receipt_number, payment_method_id } = body;

  // Validation
  if (!full_name || !dob || !phone_number || !school_id || !package_id || !receipt_number || !payment_method_id) {
    return NextResponse.json(
      { error: "Thiếu trường bắt buộc: full_name, dob, phone_number, school_id, package_id, receipt_number, payment_method_id" },
      { status: 400 }
    );
  }

  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(phone_number)) {
    return NextResponse.json(
      { error: "Số điện thoại phụ huynh phải bao gồm đúng 10 chữ số" },
      { status: 400 }
    );
  }

  // 1. Truy xuất school_code
  const { data: school, error: schoolErr } = await supabaseAdmin
    .from("schools")
    .select("school_code")
    .eq("id", school_id)
    .single();

  if (schoolErr || !school) {
    return NextResponse.json({ error: "Không tìm thấy trường học" }, { status: 400 });
  }

  // Nếu chọn "Trường khác" (mã 99): bắt buộc có other_school_name và notes
  if (school.school_code === "99") {
    if (!other_school_name || !notes) {
      return NextResponse.json(
        { error: "Khi chọn 'Trường khác', bắt buộc điền 'Tên trường khác' và 'Ghi chú học viên'" },
        { status: 400 }
      );
    }
  }

  // 2. Truy xuất sessions_count từ pricing_packages
  const { data: pkg, error: pkgErr } = await supabaseAdmin
    .from("pricing_packages")
    .select("sessions_count")
    .eq("id", package_id)
    .single();

  if (pkgErr || !pkg) {
    return NextResponse.json({ error: "Không tìm thấy gói học" }, { status: 400 });
  }

  // 3. Sinh mã thẻ với collision check (retry tối đa 5 lần)
  let cardCode = "";
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    cardCode = generateCardCode(school.school_code);
    const { data: existing } = await supabaseAdmin
      .from("registrations")
      .select("id")
      .eq("card_code", cardCode)
      .single();

    if (!existing) break; // Mã chưa tồn tại → OK
    attempts++;
  }

  if (attempts >= maxAttempts) {
    return NextResponse.json(
      { error: "Không thể sinh mã thẻ duy nhất sau 5 lần thử. Vui lòng thử lại." },
      { status: 500 }
    );
  }

  // 4. Transaction: Insert student → Insert registration
  // Insert student
  const { data: student, error: studentErr } = await supabaseAdmin
    .from("students")
    .insert({
      full_name,
      dob,
      class_name: class_name || null,
      phone_number: phone_number || null,
      school_id,
      other_school_name: other_school_name || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (studentErr || !student) {
    return NextResponse.json(
      { error: "Lỗi tạo học viên: " + (studentErr?.message || "Unknown") },
      { status: 500 }
    );
  }

  // Insert registration
  const { data: registration, error: regErr } = await supabaseAdmin
    .from("registrations")
    .insert({
      student_id: student.id,
      package_id,
      card_code: cardCode,
      status: "ACTIVE",
      remaining_sessions: pkg.sessions_count,
      receipt_number: receipt_number || null,
      payment_method_id: payment_method_id || null,
    })
    .select(`
      *,
      students (*),
      pricing_packages (*)
    `)
    .single();

  if (regErr) {
    // Rollback: xóa student đã tạo
    await supabaseAdmin.from("students").delete().eq("id", student.id);
    return NextResponse.json(
      { error: "Lỗi tạo ghi danh: " + regErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json(registration, { status: 201 });
}
