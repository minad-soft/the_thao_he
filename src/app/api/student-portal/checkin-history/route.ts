import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verifyJWT } from "@/lib/auth-utils";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("student_portal_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ" }, { status: 401 });
    }

    // Lấy tất cả registrations của student này
    const { data: registrations, error: regError } = await supabaseAdmin
      .from("registrations")
      .select("id")
      .eq("student_id", payload.studentId);

    if (regError || !registrations || registrations.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const registrationIds = registrations.map(r => r.id);

    // Lấy checkin_logs theo các registrationIds
    const { data: logs, error: logsError } = await supabaseAdmin
      .from("checkin_logs")
      .select(`
        id,
        checked_in_at,
        batch_checkins (
          shifts (
            shift_name,
            subject
          )
        ),
        registrations (
          pricing_packages (
            subject
          )
        )
      `)
      .in("registration_id", registrationIds)
      .order("checked_in_at", { ascending: false });

    if (logsError) {
      return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
    }

    const results = logs.map((log: any) => ({
      id: log.id,
      checked_in_at: log.checked_in_at,
      shift_name: log.batch_checkins?.shifts?.shift_name || "Khách vãng lai / Điểm danh nhanh",
      subject_name: log.batch_checkins?.shifts?.subject || log.registrations?.pricing_packages?.subject || "—",
    }));

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Lỗi lấy lịch sử điểm danh học viên:", error);
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  }
}
