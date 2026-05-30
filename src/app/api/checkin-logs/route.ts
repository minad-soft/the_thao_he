import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// GET /api/checkin-logs — Lấy lịch sử check-in (mặc định hôm nay)
export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabaseAdmin
    .from("checkin_logs")
    .select("*")
    .gte("checked_in_at", today.toISOString())
    .order("checked_in_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
