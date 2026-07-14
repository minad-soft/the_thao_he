import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// GET /api/students — Lấy danh sách học viên (JOIN schools + registrations)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '25');
  const search = searchParams.get('search') || '';
  const debtOnly = searchParams.get('debtOnly') === 'true';
  const exportMode = searchParams.get('export') === 'true';
  const listFilter = searchParams.get('listFilter') || '';
  const schoolFilter = searchParams.get('schoolFilter') || '';

  let studentQuery = supabaseAdmin
    .from("students")
    .select(`
      *,
      schools (school_name, school_code),
      registrations (
        id,
        card_code,
        status,
        remaining_sessions,
        is_card_issued,
        card_reissue_count,
        receipt_number,
        payment_method_id,
        package_id,
        amount_paid,
        debt_amount,
        cancelled_at,
        refund_amount,
        refund_method,
        refund_receipt_image,
        cancellation_notes,
        receipt_images,
        payment_methods (method_name),
        pricing_packages (package_name, subject, price),
        registration_payments (
          id,
          payment_method_id,
          amount,
          payment_methods (method_name)
        )
      ),
      student_preferred_shifts (shift_id)
    `, { count: "exact" });

  let matchingStudentIds: string[] | null = null;

  // Xử lý tìm kiếm toàn cục
  if (search) {
    const { data: s1 } = await supabaseAdmin
      .from('students')
      .select('id')
      .or(`full_name.ilike.%${search}%,phone_number.ilike.%${search}%`);
    
    const { data: s2 } = await supabaseAdmin
      .from('registrations')
      .select('student_id')
      .ilike('card_code', `%${search}%`);

    matchingStudentIds = [
      ...new Set([
        ...(s1?.map(s => s.id) || []),
        ...(s2?.map(s => s.student_id) || [])
      ])
    ];

    if (matchingStudentIds.length === 0) {
      return NextResponse.json({ data: [], totalCount: 0 });
    }
  }

  // Xử lý lọc nợ phí
  if (debtOnly) {
    const { data: debtRegs } = await supabaseAdmin
      .from('registrations')
      .select('student_id')
      .eq('status', 'ACTIVE')
      .gt('debt_amount', 0);
    
    const debtIds = debtRegs?.map(r => r.student_id) || [];
    
    if (matchingStudentIds) {
      matchingStudentIds = matchingStudentIds.filter(id => debtIds.includes(id));
    } else {
      matchingStudentIds = debtIds;
    }

    if (matchingStudentIds.length === 0) {
      return NextResponse.json({ data: [], totalCount: 0 });
    }
  }

  // Áp dụng bộ lọc IDs nếu có
  if (matchingStudentIds) {
    studentQuery = studentQuery.in('id', matchingStudentIds);
  }

  // Áp dụng bộ lọc danh sách lớp (listFilter)
  if (listFilter === 'TEST_BOI') {
    studentQuery = studentQuery.or('sports_preference.ilike.%ôn bơi%,sports_preference.ilike.%học bơi%');
  } else if (listFilter === 'HOC_BOI') {
    studentQuery = studentQuery.ilike('sports_preference', '%học bơi%');
  } else if (listFilter === 'BONG_RO') {
    studentQuery = studentQuery.ilike('sports_preference', '%bóng rổ%');
  } else if (listFilter === 'CAU_LONG') {
    studentQuery = studentQuery.ilike('sports_preference', '%cầu lông%');
  } else if (listFilter === 'DA_CHON') {
    studentQuery = studentQuery.not('sports_preference', 'is', null).neq('sports_preference', '');
  } else if (listFilter === 'CHUA_CHON') {
    studentQuery = studentQuery.or('sports_preference.is.null,sports_preference.eq.');
  }

  // Áp dụng bộ lọc trường học
  if (schoolFilter) {
    studentQuery = studentQuery.eq('school_id', schoolFilter);
  }

  studentQuery = studentQuery.order("created_at", { ascending: false });

  // Phân trang
  if (!exportMode) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    studentQuery = studentQuery.range(from, to);
  }

  const { data, error, count } = await studentQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Thống kê nguyện vọng
  const { data: allPreferences } = await supabaseAdmin
    .from('students')
    .select('sports_preference')
    .not('sports_preference', 'is', null);

  const preferenceStats = (allPreferences || []).reduce((acc: any, curr) => {
    const pref = curr.sports_preference;
    if (pref) {
      acc[pref] = (acc[pref] || 0) + 1;
    }
    return acc;
  }, {});

  return NextResponse.json({ data, totalCount: count || 0, preferenceStats });
}
