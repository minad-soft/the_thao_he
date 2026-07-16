import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// GET /api/checkin-logs — Lấy lịch sử check-in (mặc định hôm nay)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const registrationId = searchParams.get("registration_id");

  let query = supabaseAdmin
    .from("checkin_logs")
    .select(`
      *,
      registrations(
        students(
          full_name,
          sports_preference
        )
      )
    `)
    .order("checked_in_at", { ascending: false });

  if (registrationId) {
    query = query.eq("registration_id", registrationId);
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    query = query.gte("checked_in_at", today.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
