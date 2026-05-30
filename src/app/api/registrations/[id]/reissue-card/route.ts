import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { new_card_code } = body;

    if (!new_card_code) {
      return NextResponse.json({ error: "Thiếu mã thẻ mới" }, { status: 400 });
    }

    // Kiểm tra xem mã thẻ mới đã tồn tại chưa
    const { data: existing } = await supabaseAdmin
      .from("registrations")
      .select("id")
      .eq("card_code", new_card_code)
      .single();

    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Mã thẻ này đã được sử dụng cho học viên khác" }, { status: 400 });
    }

    // Lấy thông tin hiện tại để tăng card_reissue_count
    const { data: currentReg, error: fetchErr } = await supabaseAdmin
      .from("registrations")
      .select("card_reissue_count")
      .eq("id", id)
      .single();

    if (fetchErr || !currentReg) {
      return NextResponse.json({ error: "Không tìm thấy thông tin ghi danh" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("registrations")
      .update({ 
        card_code: new_card_code,
        is_card_issued: true,
        card_reissue_count: (currentReg.card_reissue_count || 0) + 1
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
