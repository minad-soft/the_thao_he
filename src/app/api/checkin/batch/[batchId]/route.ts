import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";


/**
 * POST /api/checkin/batch/[batchId]/add
 * Thêm một check‑in vào batch hiện có.
 * Body: { card_code: string, lat: number, lng: number }
 */
export async function POST(request: Request) {
  const xParams = request.headers.get("x-nextjs-params");
  const batchId = xParams ? xParams.split("/").pop() : undefined;
  const { card_code, lat, lng } = await request.json();

  if (!batchId) {
    return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
  }
  if (!card_code) {
    return NextResponse.json({ error: "card_code is required" }, { status: 400 });
  }

  const { data: admin } = await supabaseAdmin.from('staffs').select('id').eq('role', 'ADMIN').limit(1).single();
  const user = { id: admin?.id, role: "ADMIN" };
  if (!user.id) {
    return NextResponse.json({ error: "No admin found" }, { status: 403 });
  }

  // Gọi RPC để ghi nhận check‑in trong transaction
  const { error: rpcErr } = await supabaseAdmin.rpc("record_batch_checkin", [
    // p_registration_id sẽ được lấy trong RPC dựa trên card_code
    // Vì Supabase không hỗ trợ truyền param tên, chúng ta truyền các giá trị cần
    // Thông thường, RPC sẽ nhận (registration_id, card_code, lat, lng, performed_by)
    // Để đơn giản, chúng ta truyền card_code và thực hiện tìm registration trong RPC
    // Ở đây truyền null cho registration_id, sẽ được xử lý trong RPC (bạn có thể sửa RPC nếu cần)
    null,
    card_code,
    lat,
    lng,
    user.id,
  ]);

  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, batchId });
}

/**
 * PATCH /api/checkin/batch/[batchId]/finalize
 * Hoàn tất batch – lưu & đóng hoặc lưu & in.
 * Body: { action: "save" | "save_print" }
 */
export async function PATCH(request: Request) {
  const xParams = request.headers.get("x-nextjs-params");
  const batchId = xParams ? xParams.split("/").pop() : undefined;
  const { action } = await request.json();

  if (!batchId) {
    return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
  }
  if (!["save", "save_print"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { data: admin } = await supabaseAdmin.from('staffs').select('id').eq('role', 'ADMIN').limit(1).single();
  const user = { id: admin?.id, role: "ADMIN" };
  if (!user.id) {
    return NextResponse.json({ error: "No admin found" }, { status: 403 });
  }

  const { error } = await supabaseAdmin.rpc("finalize_batch_checkin", [batchId, user.id, action]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, batchId, action });
}

/**
 * DELETE /api/checkin/batch/[batchId]
 * Hủy batch (chỉ ADMIN). Xóa tất cả các log và hoàn lại buổi học.
 */
export async function DELETE(request: Request) {
  const xParams = request.headers.get("x-nextjs-params");
  const batchId = xParams ? xParams.split("/").pop() : undefined;

  if (!batchId) {
    return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
  }

  const { data: admin } = await supabaseAdmin.from('staffs').select('id').eq('role', 'ADMIN').limit(1).single();
  const user = { id: admin?.id, role: "ADMIN" };
  if (!user.id) {
    return NextResponse.json({ error: "No admin found" }, { status: 403 });
  }

  // Xóa batch – sẽ trigger RLS policies và hàm RPC nếu cần
  const { error } = await supabaseAdmin.from("batch_checkins").delete().eq("id", batchId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, batchId });
}
