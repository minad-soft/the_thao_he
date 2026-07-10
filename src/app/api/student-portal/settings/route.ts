import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    // Lấy thông tin các môn học và địa điểm
    const { data: subjects, error: subError } = await supabaseAdmin
      .from("subjects")
      .select("id, subject_name, location, notes, show_notes");

    if (subError) {
      console.error("Lỗi truy vấn môn học:", subError);
      return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
    }

    // Lấy thông tin lịch học
    const { data: shifts, error: shiftError } = await supabaseAdmin
      .from("shifts")
      .select("id, shift_name, subject, start_date, end_date, start_time, end_time, days_of_week");

    if (shiftError) {
      console.error("Lỗi truy vấn lịch học:", shiftError);
      return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
    }

    // Format dữ liệu trả về để Frontend dễ sử dụng
    // Group shifts by subject name
    const schedules: Record<string, any[]> = {};
    const locations: Record<string, string> = {};
    const subjectNotes: Record<string, { notes: string | null; show_notes: boolean }> = {};

    subjects.forEach((sub) => {
      if (sub.subject_name) {
        locations[sub.subject_name] = sub.location || "Chưa cập nhật địa điểm";
        subjectNotes[sub.subject_name] = {
          notes: sub.notes,
          show_notes: sub.show_notes || false,
        };
      }
    });

    shifts.forEach((shift) => {
      if (!schedules[shift.subject]) {
        schedules[shift.subject] = [];
      }
      schedules[shift.subject].push({
        name: shift.shift_name,
        startDate: shift.start_date,
        endDate: shift.end_date,
        startTime: shift.start_time,
        endTime: shift.end_time,
        daysOfWeek: shift.days_of_week
      });
    });

    return NextResponse.json({ schedules, locations, subjectNotes });
  } catch (error) {
    console.error("Lỗi lấy cài đặt:", error);
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  }
}
