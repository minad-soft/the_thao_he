import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// PUT /api/bank-accounts/[id] — Cập nhật tài khoản ngân hàng
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { bank_name, account_code, account_number, account_holder, branch, is_default } = body;

  // Nếu is_default = true, reset tất cả tài khoản khác về false trước
  if (is_default === true) {
    const { error: resetError } = await supabaseAdmin
      .from("bank_accounts")
      .update({ is_default: false })
      .neq("id", id);

    if (resetError) {
      return NextResponse.json({ error: resetError.message }, { status: 500 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("bank_accounts")
    .update({
      bank_name,
      account_code,
      account_number,
      account_holder,
      branch,
      is_default,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/bank-accounts/[id] — Xóa tài khoản ngân hàng
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("bank_accounts")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
