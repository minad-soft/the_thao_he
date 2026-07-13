import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// GET /api/refund-requests/public/[token] — Lấy thông tin cơ bản cho Phụ huynh
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Không cần auth ở đây, truy cập thông qua token
    const { data, error } = await supabaseAdmin
      .from("refund_requests")
      .select(`
        id,
        status,
        registration:registrations (
          amount_paid,
          student:students(full_name),
          package:pricing_packages(package_name)
        )
      `)
      .eq("token", token)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Link không tồn tại hoặc đã hết hạn" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/refund-requests/public/[token] — Phụ huynh điền form và nộp
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { parent_name, relation, phone, reason, bank_name, bank_account, bank_owner } = body;

    // Validate
    if (!parent_name || !relation || !phone || !bank_name || !bank_account || !bank_owner) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ thông tin bắt buộc" }, { status: 400 });
    }

    // Cập nhật thông tin và chuyển trạng thái sang pending_accountant
    const { data, error } = await supabaseAdmin
      .from("refund_requests")
      .update({
        parent_name,
        relation,
        phone,
        reason,
        bank_name,
        bank_account,
        bank_owner,
        status: 'pending_accountant'
      })
      .eq("token", token)
      .eq("status", "pending_info") // Chỉ cho phép cập nhật khi đang ở trạng thái này
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Không thể cập nhật yêu cầu. Yêu cầu có thể đã được xử lý." }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
