import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    // 1. Lấy dữ liệu cho Stat Cards
    const { count: studentsCount } = await supabaseAdmin
      .from("students")
      .select("*", { count: "exact", head: true });

    const { count: checkinsCount } = await supabaseAdmin
      .from("checkin_logs")
      .select("*", { count: "exact", head: true });

    const { count: shiftsCount } = await supabaseAdmin
      .from("shifts")
      .select("*", { count: "exact", head: true });

    // Để tính tổng doanh thu, ta lấy tất cả registration cùng với amount_paid và package của chúng
    const { data: registrations } = await supabaseAdmin
      .from("registrations")
      .select(`
        id,
        amount_paid,
        pricing_packages ( id, price, package_name, subject )
      `);

    let totalRevenue = 0;
    const revenueByPackage: Record<string, { package_name: string; subject: string; revenue: number; students: number }> = {};

    if (registrations) {
      registrations.forEach((reg) => {
        const pkgData = reg.pricing_packages as any;
        const pkg = Array.isArray(pkgData) ? pkgData[0] : pkgData;
        const paidAmount = Number(reg.amount_paid) || 0;
        totalRevenue += paidAmount;

        if (pkg) {
          if (!revenueByPackage[pkg.id]) {
            revenueByPackage[pkg.id] = {
              package_name: pkg.package_name,
              subject: pkg.subject,
              revenue: 0,
              students: 0,
            };
          }
          revenueByPackage[pkg.id].revenue += paidAmount;
          revenueByPackage[pkg.id].students += 1;
        }
      });
    }

    const revenueData = Object.values(revenueByPackage).sort((a, b) => b.revenue - a.revenue);

    // 3. Lượt check-in 7 ngày qua
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data: checkinLogs } = await supabaseAdmin
      .from("checkin_logs")
      .select("checked_in_at")
      .gte("checked_in_at", sevenDaysAgo.toISOString());

    const checkinByDate: Record<string, number> = {};
    
    // Khởi tạo 7 ngày gần nhất với giá trị 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      checkinByDate[dateStr] = 0;
    }

    if (checkinLogs) {
      checkinLogs.forEach((log) => {
        const dateStr = new Date(log.checked_in_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        if (checkinByDate[dateStr] !== undefined) {
          checkinByDate[dateStr] += 1;
        }
      });
    }

    const checkinData = Object.keys(checkinByDate).map(date => ({
      date,
      count: checkinByDate[date]
    }));

    return NextResponse.json({
      stats: {
        totalStudents: studentsCount || 0,
        totalCheckins: checkinsCount || 0,
        totalShifts: shiftsCount || 0,
        totalRevenue
      },
      revenueData,
      checkinData
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
