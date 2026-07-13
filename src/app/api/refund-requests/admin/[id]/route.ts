import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verifyJWT } from "@/lib/auth-utils";

// PUT /api/refund-requests/admin/[id] — Duyệt yêu cầu bởi Kế toán / Quản lý
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("session_token")?.value;
    const user = token ? await verifyJWT(token) : null;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, receipt_image, rejection_reason } = body;

    // Validate permission based on target status
    if (status === 'pending_manager' && user.role !== 'ACCOUNTANT' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Chỉ Kế toán mới có quyền duyệt thông tin ngân hàng." }, { status: 403 });
    }
    
    if (status === 'pending_payment' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Chỉ Quản lý mới có quyền duyệt lệnh hoàn tiền." }, { status: 403 });
    }

    if (status === 'completed' && user.role !== 'ACCOUNTANT' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Chỉ Kế toán mới có quyền xác nhận chuyển khoản." }, { status: 403 });
    }

    const updateData: any = { status };

    if (status === 'pending_manager') {
      updateData.accountant_id = user.id;
    } else if (status === 'pending_payment') {
      updateData.manager_id = user.id;
    } else if (status === 'completed') {
      if (!receipt_image) {
        return NextResponse.json({ error: "Vui lòng đính kèm biên lai chuyển khoản." }, { status: 400 });
      }
      updateData.receipt_image = receipt_image;
    } else if (status === 'rejected') {
      updateData.reason = rejection_reason; // Lưu tạm lý do từ chối vào reason hoặc thêm cột sau
    }

    // 1. Cập nhật bảng refund_requests
    const { data: requestData, error: requestError } = await supabaseAdmin
      .from("refund_requests")
      .update(updateData)
      .eq("id", id)
      .select('*, registration:registrations(id, remaining_sessions)')
      .single();

    if (requestError) {
      return NextResponse.json({ error: requestError.message }, { status: 500 });
    }

    // 2. Nếu hoàn tất, tự động hủy khóa học bên registrations
    if (status === 'completed' && requestData?.registration_id) {
      const { error: regError } = await supabaseAdmin
        .from("registrations")
        .update({
          cancelled_at: new Date().toISOString(),
          status: 'CANCELLED',
          remaining_sessions: 0,
          refund_receipt_image: receipt_image,
        })
        .eq("id", requestData.registration_id);

      if (regError) {
        console.error("Lỗi khi cập nhật registrations:", regError);
        // Có thể rollback hoặc thông báo cho admin xử lý thủ công
      }
    }

    return NextResponse.json(requestData);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
