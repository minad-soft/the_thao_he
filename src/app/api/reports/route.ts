import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const schoolId = searchParams.get('schoolId');
    const paymentMethodId = searchParams.get('paymentMethodId');

    // 1. Lấy dữ liệu đăng ký (áp dụng bộ lọc)
    let registrationsQuery = supabaseAdmin
      .from("registrations")
      .select(`
        id,
        amount_paid,
        created_at,
        status,
        payment_method_id,
        refund_amount,
        refund_method,
        pricing_packages ( id, price, package_name, subject ),
        students!inner ( id, full_name, school_id, schools ( id, school_name ) ),
        payment_methods ( id, method_name ),
        registration_payments ( id, amount, payment_method_id, payment_methods ( id, method_name ) )
      `);

    if (startDate) {
      registrationsQuery = registrationsQuery.gte("created_at", startDate);
    }
    if (endDate) {
      // Để bao gồm cả ngày endDate, ta có thể set giờ đến 23:59:59
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      registrationsQuery = registrationsQuery.lte("created_at", endOfDay.toISOString());
    }
    if (schoolId) {
      registrationsQuery = registrationsQuery.eq("students.school_id", schoolId);
    }
    // We filter paymentMethodId in JS to support split payments correctly.

    const { data: registrations, error: regError } = await registrationsQuery;

    if (regError) {
      console.error("Registrations Query Error:", regError);
      throw new Error("Failed to fetch registrations data");
    }

    let totalRevenue = 0;
    const revenueByPackage: Record<string, { package_name: string; subject: string; revenue: number; students: number }> = {};
    const revenueBySchoolMap: Record<string, any> = {};
    const listData: any[] = [];
    const uniqueStudents = new Set();

    if (registrations) {
      registrations.forEach((reg: any) => {
        const pkgData = reg.pricing_packages;
        const pkg = Array.isArray(pkgData) ? pkgData[0] : pkgData;
        const studentData = reg.students;
        const student = Array.isArray(studentData) ? studentData[0] : studentData;
        const schoolData = student?.schools;
        const school = Array.isArray(schoolData) ? schoolData[0] : schoolData;
        
        const schoolName = school?.school_name || 'Khác';
        const studentName = student?.full_name || 'Không rõ';

        let payments = [];
        if (reg.registration_payments && reg.registration_payments.length > 0) {
          payments = reg.registration_payments.map((p: any) => ({
            id: p.id,
            amount: Number(p.amount) || 0,
            payment_method_id: p.payment_method_id,
            method_name: p.payment_methods?.method_name || 'Chưa xác định'
          }));
        } else {
          const paymentMethodData = reg.payment_methods;
          const paymentMethod = Array.isArray(paymentMethodData) ? paymentMethodData[0] : paymentMethodData;
          payments = [{
            id: reg.id,
            amount: Number(reg.amount_paid) || 0,
            payment_method_id: reg.payment_method_id,
            method_name: paymentMethod?.method_name || 'Chưa xác định'
          }];
        }

        // Nếu có hoàn tiền, trừ số tiền hoàn vào tổng doanh thu
        if (reg.status === 'CANCELLED' && reg.refund_amount > 0) {
          payments.push({
            id: `refund-${reg.id}`,
            amount: -Number(reg.refund_amount),
            payment_method_id: null,
            method_name: reg.refund_method ? `Hoàn tiền (${reg.refund_method})` : 'Hoàn tiền'
          });
        }

        let regTotalRevenueForPackage = 0;
        let regIncludedInCount = false;

        payments.forEach((payment: any) => {
          if (paymentMethodId && payment.payment_method_id !== paymentMethodId) {
            return;
          }

          const paidAmount = payment.amount;
          const methodName = payment.method_name;

          totalRevenue += paidAmount;
          regTotalRevenueForPackage += paidAmount;

          if (!regIncludedInCount) {
            if (student?.id) {
              uniqueStudents.add(student.id);
            }
            regIncludedInCount = true;
          }

          listData.push({
            id: `${reg.id}-${payment.id}`,
            studentName,
            schoolName,
            packageName: pkg?.package_name || 'N/A',
            paymentMethod: methodName,
            amount: paidAmount,
            createdAt: reg.created_at,
          });

          if (!revenueBySchoolMap[schoolName]) {
            revenueBySchoolMap[schoolName] = { schoolName };
          }
          if (!revenueBySchoolMap[schoolName][methodName]) {
            revenueBySchoolMap[schoolName][methodName] = 0;
          }
          revenueBySchoolMap[schoolName][methodName] += paidAmount;
        });

        if (pkg && regTotalRevenueForPackage > 0) {
          if (!revenueByPackage[pkg.id]) {
            revenueByPackage[pkg.id] = {
              package_name: pkg.package_name,
              subject: pkg.subject,
              revenue: 0,
              students: 0,
            };
          }
          revenueByPackage[pkg.id].revenue += regTotalRevenueForPackage;
          revenueByPackage[pkg.id].students += 1;
        }
      });
    }

    const revenueData = Object.values(revenueByPackage).sort((a, b) => b.revenue - a.revenue);
    const revenueBySchoolData = Object.values(revenueBySchoolMap);

    // 2. Lấy dữ liệu Check-in
    // Để lọc checkin theo thời gian, trường (thông qua registrations), ta cần query checkin_logs
    let checkinQuery = supabaseAdmin
      .from("checkin_logs")
      .select(`
        id,
        checked_in_at,
        registrations!inner (
          id,
          students!inner ( school_id )
        )
      `);

    if (startDate) {
      checkinQuery = checkinQuery.gte("checked_in_at", startDate);
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      checkinQuery = checkinQuery.lte("checked_in_at", endOfDay.toISOString());
    }
    if (schoolId) {
      checkinQuery = checkinQuery.eq("registrations.students.school_id", schoolId);
    }

    const { data: checkinLogs, error: checkinError } = await checkinQuery;
    const totalCheckins = checkinLogs ? checkinLogs.length : 0;

    // Biểu đồ lượt checkin 7 ngày qua (Dựa trên bộ lọc nếu có, nhưng thường chart này hiển thị cố định 7 ngày, ta có thể kết hợp filter, nhưng để đơn giản, ta chỉ lọc theo trường)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    // Nếu startDate có truyền và lớn hơn 7 ngày trước, hoặc không thì lấy 7 ngày. Ta sẽ lọc lại từ checkinLogs đã query
    const checkinByDate: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      checkinByDate[dateStr] = 0;
    }

    if (checkinLogs) {
      checkinLogs.forEach((log: any) => {
        const logDate = new Date(log.checked_in_at);
        if (logDate >= sevenDaysAgo) {
          const dateStr = logDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
          if (checkinByDate[dateStr] !== undefined) {
            checkinByDate[dateStr] += 1;
          }
        }
      });
    }

    const checkinData = Object.keys(checkinByDate).map(date => ({
      date,
      count: checkinByDate[date]
    }));

    // 3. Shifts Count (Số ca học - Khó lọc chính xác nếu không join qua registrations, ta giữ nguyên tổng hoặc đếm số ca đang active)
    const { count: shiftsCount } = await supabaseAdmin
      .from("shifts")
      .select("*", { count: "exact", head: true });

    const sortedListData = listData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const exportMode = searchParams.get('export') === 'true';

    const paginatedListData = exportMode ? sortedListData : sortedListData.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      stats: {
        totalStudents: uniqueStudents.size, // Học viên đã lọc
        totalCheckins: totalCheckins, // Lượt checkin đã lọc
        totalShifts: shiftsCount || 0,
        totalRevenue
      },
      revenueData,
      revenueBySchoolData,
      checkinData,
      listData: paginatedListData,
      totalListCount: sortedListData.length
    });

  } catch (error: any) {
    console.error("API Reports Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
