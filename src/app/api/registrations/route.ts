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
      pricing_packages (*),
      registration_payments (
        id,
        payment_method_id,
        amount,
        payment_methods (method_name)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/registrations — Ghi danh mới (Transaction: Student + Registration + Payments)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { 
    full_name, dob, gender, class_name, phone_number, school_id, 
    other_school_name, notes, package_id, receipt_number, amount_paid, payments,
    receipt_images
  } = body;

  // Validation
  if (!full_name || !dob || !gender || !phone_number || !school_id || !package_id || !receipt_number) {
    return NextResponse.json(
      { error: "Thiếu trường bắt buộc: full_name, dob, gender, phone_number, school_id, package_id, receipt_number" },
      { status: 400 }
    );
  }

  // Validate gender
  if (gender !== "Nam" && gender !== "Nữ" && gender !== "Khác") {
    return NextResponse.json(
      { error: "Giới tính không hợp lệ. Chỉ chấp nhận: Nam, Nữ, Khác" },
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

  // 2. Truy xuất sessions_count và price từ pricing_packages
  const { data: pkg, error: pkgErr } = await supabaseAdmin
    .from("pricing_packages")
    .select("sessions_count, price")
    .eq("id", package_id)
    .single();

  if (pkgErr || !pkg) {
    return NextResponse.json({ error: "Không tìm thấy gói học" }, { status: 400 });
  }

  // Validate amounts
  const totalPaid = Number(amount_paid) || 0;
  if (totalPaid < 0) {
    return NextResponse.json({ error: "Số tiền thanh toán không được âm" }, { status: 400 });
  }
  if (totalPaid > pkg.price) {
    return NextResponse.json(
      { error: `Số tiền thanh toán (${totalPaid}) vượt quá giá trị gói học (${pkg.price})` },
      { status: 400 }
    );
  }

  // Validate payments array if totalPaid > 0
  if (totalPaid > 0) {
    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json(
        { error: "Vui lòng chọn ít nhất một phương thức thanh toán" },
        { status: 400 }
      );
    }

    const sumPayments = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    if (Math.abs(sumPayments - totalPaid) > 0.01) {
      return NextResponse.json(
        { error: `Tổng số tiền phân bổ (${sumPayments}) phải bằng số tiền thanh toán thực tế (${totalPaid})` },
        { status: 400 }
      );
    }
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

  // 4. Transaction: Insert student → Insert registration → Insert payments
  // Insert student
  const { data: student, error: studentErr } = await supabaseAdmin
    .from("students")
    .insert({
      full_name,
      dob,
      gender,
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
  const firstPaymentMethodId = payments?.[0]?.payment_method_id || null;
  const { data: registration, error: regErr } = await supabaseAdmin
    .from("registrations")
    .insert({
      student_id: student.id,
      package_id,
      card_code: cardCode,
      status: "ACTIVE",
      remaining_sessions: pkg.sessions_count,
      receipt_number: receipt_number || null,
      payment_method_id: firstPaymentMethodId, // Cho khả năng tương thích ngược
      amount_paid: totalPaid,
      debt_amount: pkg.price - totalPaid,
      receipt_images: receipt_images || []
    })
    .select(`
      *,
      students (*),
      pricing_packages (*)
    `)
    .single();

  if (regErr || !registration) {
    // Rollback: xóa student đã tạo
    await supabaseAdmin.from("students").delete().eq("id", student.id);
    return NextResponse.json(
      { error: "Lỗi tạo ghi danh: " + (regErr?.message || "Unknown") },
      { status: 500 }
    );
  }

  // Insert registration payments details
  if (totalPaid > 0 && payments && payments.length > 0) {
    const paymentsData = payments.map((p: any) => ({
      registration_id: registration.id,
      payment_method_id: p.payment_method_id,
      amount: Number(p.amount) || 0,
    }));

    const { error: payErr } = await supabaseAdmin
      .from("registration_payments")
      .insert(paymentsData);

    if (payErr) {
      // Rollback: xóa registration và student đã tạo
      await supabaseAdmin.from("registrations").delete().eq("id", registration.id);
      await supabaseAdmin.from("students").delete().eq("id", student.id);
      return NextResponse.json(
        { error: "Lỗi tạo chi tiết thanh toán phối hợp: " + payErr.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(registration, { status: 201 });
}
