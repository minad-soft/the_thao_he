import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// PUT /api/registrations/[id]/cancel — Hủy đăng ký học viên (lưu lý do, thông tin hoàn tiền & chứng từ)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { refund_amount, refund_method, refund_receipt_image, cancellation_notes } = body;

    // 1. Kiểm tra sự tồn tại của ghi danh
    const { data: reg, error: regErr } = await supabaseAdmin
      .from("registrations")
      .select("id, status, amount_paid")
      .eq("id", id)
      .single();

    if (regErr || !reg) {
      return NextResponse.json({ error: "Không tìm thấy thông tin ghi danh" }, { status: 400 });
    }

    if (reg.status === "CANCELLED") {
      return NextResponse.json({ error: "Ghi danh này đã bị hủy trước đó" }, { status: 400 });
    }

    // 2. Thực hiện cập nhật hủy ghi danh
    const refundAmt = Number(refund_amount) || 0;
    const paidAmt = Number(reg.amount_paid) || 0;

    if (refundAmt > paidAmt) {
      return NextResponse.json(
        { error: `Số tiền hoàn trả (${refundAmt}) không được lớn hơn số tiền đã đóng (${paidAmt})` },
        { status: 400 }
      );
    }
    
    const { data: updatedReg, error: cancelErr } = await supabaseAdmin
      .from("registrations")
      .update({
        status: "CANCELLED",
        remaining_sessions: 0, // Hủy buổi học còn lại
        cancelled_at: new Date().toISOString(),
        refund_amount: refundAmt,
        refund_method: refundAmt > 0 ? (refund_method || null) : null,
        refund_receipt_image: refundAmt > 0 ? (refund_receipt_image || null) : null,
        cancellation_notes: cancellation_notes || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (cancelErr) {
      return NextResponse.json({ error: "Lỗi thực hiện hủy đăng ký: " + cancelErr.message }, { status: 500 });
    }

    return NextResponse.json(updatedReg);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Lỗi xử lý hệ thống" }, { status: 500 });
  }
}
