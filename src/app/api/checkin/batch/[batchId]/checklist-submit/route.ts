import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const xParams = request.headers.get("x-nextjs-params");
  const batchId = xParams ? xParams.split("/").pop() : undefined;
  
  if (!batchId) {
    return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
  }

  const { card_codes, action } = await request.json();

  if (!card_codes || !Array.isArray(card_codes)) {
    return NextResponse.json({ error: "Yêu cầu mảng card_codes" }, { status: 400 });
  }

  const { data: admin } = await supabaseAdmin.from('staffs').select('id').eq('role', 'ADMIN').limit(1).single();
  const user = { id: admin?.id, role: "ADMIN" };
  if (!user.id) {
    return NextResponse.json({ error: "No admin found" }, { status: 403 });
  }

  const results = [];
  const errors = [];

  // Lấy các checkin_logs hiện tại của batch để đồng bộ (xoá những bạn bị bỏ tích)
  const { data: existingLogs } = await supabaseAdmin
    .from("checkin_logs")
    .select('id, registrations(card_code)')
    .eq("batch_checkin_id", batchId);

  const logsToDelete = existingLogs
    ?.filter((log: any) => !card_codes.includes(log.registrations?.card_code))
    .map((log: any) => log.id);

  if (logsToDelete && logsToDelete.length > 0) {
    await supabaseAdmin.from("checkin_logs").delete().in("id", logsToDelete);
  }

  // Loop qua các thẻ để gọi RPC điểm danh giống như quét máy
  for (const card_code of card_codes) {
    const { error: rpcErr } = await supabaseAdmin.rpc("record_batch_checkin", [
      null,
      card_code,
      null, // lat
      null, // lng
      user.id,
    ]);

    if (rpcErr) {
      // Bỏ qua lỗi Duplicate (đã quét rồi) để không bị crash toàn bộ
      if (!rpcErr.message.includes("already checked in")) {
        errors.push({ card_code, error: rpcErr.message });
      }
    } else {
      results.push(card_code);
    }
  }

  // Nếu action không phải save_draft thì đánh dấu hoàn tất batch
  if (action !== "save_draft") {
    const finalizeAction = action === "save_print" ? "save_print" : "save";
    const { error: finalizeErr } = await supabaseAdmin.rpc("finalize_batch_checkin", [batchId, user.id, finalizeAction]);
    if (finalizeErr) {
      return NextResponse.json({ error: finalizeErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ 
    success: true, 
    batchId, 
    checkedInCount: results.length,
    errors 
  });
}
