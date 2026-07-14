import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "25", 10);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const shiftId = searchParams.get("shiftId");
  const search = searchParams.get("search");

  let query = supabaseAdmin
    .from("checkin_logs")
    .select(`
      id,
      checked_in_at,
      status,
      lat,
      lng,
      batch_checkin_id,
      registrations (
        student_id,
        card_code,
        remaining_sessions,
        students ( id, full_name, school_id, schools (school_name) ),
        pricing_packages ( subject )
      ),
      batch_checkins!inner (
        shift_id,
        shifts ( id, shift_name, subject )
      )
    `, { count: "exact" });

  if (startDate) {
    // start of day
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    query = query.gte("checked_in_at", start.toISOString());
  }

  if (endDate) {
    // end of day
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query = query.lte("checked_in_at", end.toISOString());
  }

  if (shiftId) {
    query = query.eq("batch_checkins.shift_id", shiftId);
  }

  // Text search requires a different approach since it's nested
  // But we can do it on the client or using a rpc if it's too complex.
  // For simplicity, we fetch more and filter locally if search is provided.
  // Or better, we can filter using PostgREST syntax if possible.
  
  // Note: Filtering on nested relations in Supabase:
  // e.g. .ilike('registrations.students.full_name', `%${search}%`) is supported if inner join!
  if (search) {
    // We can't easily inner join registrations.students in supabase JS without custom RPC for nested OR.
    // We will just fetch and filter in JS if there's a search term.
    // If pagination is strictly needed with search, we should use an RPC.
    // For now, let's fetch without pagination if search is present, or just filter after.
  }

  // Without search, we can paginate normally
  if (!search) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.order("checked_in_at", { ascending: false }).range(from, to);
  } else {
    query = query.order("checked_in_at", { ascending: false });
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let results = data.map((log: any) => ({
    id: log.id,
    checked_in_at: log.checked_in_at,
    student_name: log.registrations?.students?.full_name || "Unknown",
    card_code: log.registrations?.card_code,
    school_name: log.registrations?.students?.schools?.school_name || "—",
    subject_name: log.batch_checkins?.shifts?.subject || log.registrations?.pricing_packages?.subject || "—",
    shift_name: log.batch_checkins?.shifts?.shift_name || "Khách vãng lai / Quét thẻ trực tiếp",
    remaining_sessions: log.registrations?.remaining_sessions,
    status: log.status,
    location: { lat: log.lat, lng: log.lng }
  }));

  if (search) {
    const s = search.toLowerCase();
    results = results.filter((r: any) => 
      r.student_name.toLowerCase().includes(s) || 
      (r.card_code && r.card_code.toLowerCase().includes(s))
    );
    
    // Manual pagination after search
    const from = (page - 1) * limit;
    const paginatedResults = results.slice(from, from + limit);
    return NextResponse.json({
      data: paginatedResults,
      totalCount: results.length,
      page,
      limit
    });
  }

  return NextResponse.json({
    data: results,
    totalCount: count || 0,
    page,
    limit
  });
}
