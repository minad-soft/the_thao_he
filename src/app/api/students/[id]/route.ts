import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { 
    full_name, phone_number, dob, gender, class_name, school_id, other_school_name, notes,
    package_id, receipt_number, status, remaining_sessions, amount_paid, payments 
  } = body;

  // Validation
  if (!full_name || !dob || !gender || !phone_number || !school_id || !package_id || !receipt_number) {
    return NextResponse.json(
      { error: "Thiếu trường bắt buộc: full_name, dob, gender, phone_number, school_id, package_id, receipt_number" },
      { status: 400 }
    );
  }

  if (gender !== "Nam" && gender !== "Nữ" && gender !== "Khác") {
    return NextResponse.json(
      { error: "Giới tính không hợp lệ. Chỉ chấp nhận: Nam, Nữ, Khác" },
      { status: 400 }
    );
  }

  // 1. Cập nhật bảng students
  const { data: studentData, error: studentError } = await supabaseAdmin
    .from("students")
    .update({ full_name, phone_number, dob, gender, class_name, school_id, other_school_name, notes })
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

    // Lấy giá gói học để tính công nợ chính xác
    const { data: pkg, error: pkgErr } = await supabaseAdmin
      .from("pricing_packages")
      .select("price")
      .eq("id", package_id)
      .single();

    if (pkgErr || !pkg) {
      return NextResponse.json({ error: "Không tìm thấy gói học" }, { status: 400 });
    }

    const totalPaid = Number(amount_paid) || 0;
    const debtAmount = pkg.price - totalPaid;
    const firstPaymentMethodId = payments?.[0]?.payment_method_id || null;

    const { error: regError } = await supabaseAdmin
      .from("registrations")
      .update({ 
        package_id, 
        receipt_number, 
        payment_method_id: firstPaymentMethodId, 
        status, 
        remaining_sessions,
        amount_paid: totalPaid,
        debt_amount: debtAmount
      })
      .eq("id", regId);
      
    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 });
    }

    // Cập nhật chi tiết các phương thức thanh toán phối hợp
    if (payments) {
      // Xóa tất cả thanh toán cũ của registration này
      const { error: delError } = await supabaseAdmin
        .from("registration_payments")
        .delete()
        .eq("registration_id", regId);

      if (delError) {
        return NextResponse.json({ error: "Lỗi xóa chi tiết thanh toán cũ: " + delError.message }, { status: 500 });
      }

      // Thêm mới các thanh toán chi tiết nếu số tiền > 0
      if (totalPaid > 0 && payments.length > 0) {
        const paymentsData = payments.map((p: any) => ({
          registration_id: regId,
          payment_method_id: p.payment_method_id,
          amount: Number(p.amount) || 0,
        }));

        const { error: payErr } = await supabaseAdmin
          .from("registration_payments")
          .insert(paymentsData);

        if (payErr) {
          return NextResponse.json({ error: "Lỗi tạo chi tiết thanh toán mới: " + payErr.message }, { status: 500 });
        }
      }
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
