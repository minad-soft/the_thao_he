import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// GET /api/students — Lấy danh sách học viên (JOIN schools + registrations)
export async function GET() {
  const { data, error } = await supabaseAdmin
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
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
