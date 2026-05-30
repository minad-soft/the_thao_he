import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// PUT /api/pricing-packages/[id] — Cập nhật gói học
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { package_name, subject, subject_id, price, sessions_count, duration_type, print_ticket } = body;

  const { data, error } = await supabaseAdmin
    .from("pricing_packages")
    .update({
      package_name,
      subject,
      subject_id: subject_id ?? null,
      price: price != null ? parseFloat(price) : undefined,
      sessions_count: sessions_count != null ? parseInt(sessions_count) : undefined,
      duration_type,
      print_ticket,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/pricing-packages/[id] — Xóa gói học
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("pricing_packages")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
