import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import crypto from "crypto";
import { verifyJWT } from "@/lib/auth-utils";

// GET /api/refund-requests — Lấy danh sách yêu cầu hoàn tiền (dành cho Admin/Kế toán/Quản lý)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    const user = token ? await verifyJWT(token) : null;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("refund_requests")
      .select(`
        *,
        registration:registrations (
          id,
          amount_paid,
          student:students(full_name, phone_number),
          package:pricing_packages(package_name, price)
        ),
        creator:staffs!refund_requests_created_by_fkey(full_name),
        accountant:staffs!refund_requests_accountant_id_fkey(full_name),
        manager:staffs!refund_requests_manager_id_fkey(full_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/refund-requests — Tạo yêu cầu hoàn tiền & Magic Link
export async function POST(request: NextRequest) {
  try {
    const token_cookie = request.cookies.get("session_token")?.value;
    const user = token_cookie ? await verifyJWT(token_cookie) : null;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { registration_id } = body;

    if (!registration_id) {
      return NextResponse.json({ error: "registration_id is required" }, { status: 400 });
    }

    // Sinh token ngẫu nhiên
    const token = crypto.randomBytes(32).toString('hex');

    const insertData = {
      registration_id,
      token,
      status: 'pending_info' as const,
      created_by: user.id
    };

    const { data, error } = await supabaseAdmin
      .from("refund_requests")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // Bắt lỗi unique constraint nếu đã tạo (1 registration chỉ nên có 1 yêu cầu pending)
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trả về kèm domain để tạo link đầy đủ trên client
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const magicLink = `${appUrl}/refund-request/${token}`;

    return NextResponse.json({ ...data, magicLink }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 500 });
  }
}
