import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";


/**
 * POST /api/checkin/batch
 * Tạo batch check‑in mới.
 * Body: { shift_id: string }
 */
export async function POST(request: Request) {
  const { shift_id } = await request.json();
  if (!shift_id) {
    return NextResponse.json({ error: "shift_id is required" }, { status: 400 });
  }

  // Lấy thông tin người thực hiện từ session (ADMIN/STAFF)
  const { data: admin } = await supabaseAdmin.from('staffs').select('id').eq('role', 'ADMIN').limit(1).single();
  const user = { id: admin?.id, role: "ADMIN" };
  if (!user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("batch_checkins")
    .insert({
      shift_id,
      performed_by: user.id,
      status: "IN_PROGRESS",
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Failed to create batch" }, { status: 500 });
  }

  return NextResponse.json({ batchId: data.id });
}
