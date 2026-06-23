import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// PUT /api/registrations/[id]/receipt-images — Cập nhật danh sách ảnh phiếu thu
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { receipt_images } = body;

    if (!Array.isArray(receipt_images)) {
      return NextResponse.json({ error: "Dữ liệu ảnh không hợp lệ (phải là danh sách)" }, { status: 400 });
    }

    if (receipt_images.length > 2) {
      return NextResponse.json({ error: "Chỉ được tải lên tối đa 2 ảnh phiếu thu" }, { status: 400 });
    }

    // Cập nhật trường receipt_images trong bảng registrations
    const { data: updatedReg, error: updateErr } = await supabaseAdmin
      .from("registrations")
      .update({
        receipt_images: receipt_images,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: "Lỗi cập nhật ảnh phiếu thu: " + updateErr.message }, { status: 500 });
    }

    return NextResponse.json(updatedReg);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Lỗi xử lý hệ thống" }, { status: 500 });
  }
}
