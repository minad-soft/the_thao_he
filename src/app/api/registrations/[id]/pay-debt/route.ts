import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// PUT /api/registrations/[id]/pay-debt — Tất toán / Đóng thêm tiền công nợ
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount_to_pay, receipt_number, payments } = body;

    // 1. Validation
    const payAmount = Number(amount_to_pay) || 0;
    if (payAmount <= 0) {
      return NextResponse.json({ error: "Số tiền thanh toán phải lớn hơn 0" }, { status: 400 });
    }

    if (!receipt_number?.trim()) {
      return NextResponse.json({ error: "Thiếu số phiếu thu mới" }, { status: 400 });
    }

    // 2. Lấy thông tin ghi danh hiện tại
    const { data: reg, error: regErr } = await supabaseAdmin
      .from("registrations")
      .select("amount_paid, debt_amount, payment_method_id, receipt_number")
      .eq("id", id)
      .single();

    if (regErr || !reg) {
      return NextResponse.json({ error: "Không tìm thấy thông tin ghi danh" }, { status: 400 });
    }

    const currentDebt = Number(reg.debt_amount) || 0;
    if (currentDebt <= 0) {
      return NextResponse.json({ error: "Học viên này đã hoàn thành học phí, không có công nợ" }, { status: 400 });
    }

    if (payAmount > currentDebt) {
      return NextResponse.json(
        { error: `Số tiền đóng thêm (${payAmount}) vượt quá số nợ hiện tại (${currentDebt})` },
        { status: 400 }
      );
    }

    // Validate payments array
    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json({ error: "Vui lòng cung cấp ít nhất một phương thức thanh toán" }, { status: 400 });
    }

    const sumPayments = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    if (Math.abs(sumPayments - payAmount) > 0.01) {
      return NextResponse.json(
        { error: `Tổng phân bổ phương thức (${sumPayments}) phải bằng số tiền thanh toán (${payAmount})` },
        { status: 400 }
      );
    }

    const currentPaid = Number(reg.amount_paid) || 0;
    const newPaid = currentPaid + payAmount;
    const newDebt = currentDebt - payAmount;
    const firstPaymentMethodId = reg.payment_method_id || payments[0]?.payment_method_id || null;

    // 3. Thực hiện cập nhật DB (Transaction simulation)
    // Bước 3.1: Cập nhật registration
    const { data: updatedReg, error: updateErr } = await supabaseAdmin
      .from("registrations")
      .update({
        amount_paid: newPaid,
        debt_amount: newDebt,
        receipt_number: receipt_number.trim(),
        payment_method_id: firstPaymentMethodId,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: "Lỗi cập nhật số tiền ghi danh: " + updateErr.message }, { status: 500 });
    }

    // Bước 3.2: Thêm các bản ghi thanh toán chi tiết mới
    const paymentsData = payments.map((p: any) => ({
      registration_id: id,
      payment_method_id: p.payment_method_id,
      amount: Number(p.amount) || 0,
    }));

    const { error: insertErr } = await supabaseAdmin
      .from("registration_payments")
      .insert(paymentsData);

    if (insertErr) {
      // Rollback: Khôi phục lại trạng thái cũ của registration
      await supabaseAdmin
        .from("registrations")
        .update({
          amount_paid: reg.amount_paid,
          debt_amount: reg.debt_amount,
          receipt_number: reg.receipt_number || null,
          payment_method_id: reg.payment_method_id,
        })
        .eq("id", id);

      return NextResponse.json({ error: "Lỗi lưu chi tiết đợt thanh toán nợ: " + insertErr.message }, { status: 500 });
    }

    return NextResponse.json(updatedReg);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Lỗi xử lý hệ thống" }, { status: 500 });
  }
}
